"use client";

import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { BracesIcon, FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";

import { useSessionStore } from "@/lib/session-store";
import type { VfsListEntry } from "@/lib/vfs/types";

interface FileItem {
	name: string;
	children?: string[];
	type?: "directory" | "file" | "json" | "md";
	path?: string;
}

export type VfsFilePreview = {
	path: string;
	content: string;
};

const ROOT_ID = "marketplace";
const indent = 20;

function sessionQuery(
	role: string,
	personaId: string,
	ticketId: string | null,
) {
	const params = new URLSearchParams({
		role,
		personaId,
	});
	if (ticketId) {
		params.set("ticketId", ticketId);
	}
	return params;
}

function emptyRoot(): Record<string, FileItem> {
	return {
		[ROOT_ID]: {
			name: "marketplace",
			children: [],
			type: "directory",
			path: ROOT_ID,
		},
	};
}

export function VfsTree({
	onFileOpen,
}: {
	onFileOpen?: (preview: VfsFilePreview) => void;
}) {
	const { role, personaId, ticketId } = useSessionStore();
	const [items, setItems] = useState<Record<string, FileItem>>(emptyRoot);
	const [treeKey, setTreeKey] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const ready = Boolean(role && personaId && (role !== "SUPPORT" || ticketId));

	useEffect(() => {
		if (!ready || !role || !personaId) {
			setItems(emptyRoot());
			setTreeKey((k) => k + 1);
			return;
		}

		let cancelled = false;
		const params = sessionQuery(role, personaId, ticketId);
		params.set("path", ROOT_ID);
		params.set("reset", "1");

		async function loadRoot() {
			setError(null);
			try {
				const res = await fetch(`/api/vfs/list?${params.toString()}`);
				const data = (await res.json()) as {
					entries?: VfsListEntry[];
					error?: string;
				};
				if (!res.ok) {
					throw new Error(data.error ?? "Failed to list VFS");
				}
				if (cancelled) return;

				const next = emptyRoot();
				mergeEntries(next, ROOT_ID, data.entries ?? []);
				setItems(next);
				setTreeKey((k) => k + 1);
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "VFS load failed");
				}
			}
		}

		void loadRoot();
		return () => {
			cancelled = true;
		};
	}, [ready, role, personaId, ticketId]);

	async function expandFolder(path: string, itemId: string) {
		if (!role || !personaId) return;
		const params = sessionQuery(role, personaId, ticketId);
		params.set("path", path);
		const res = await fetch(`/api/vfs/list?${params.toString()}`);
		const data = (await res.json()) as {
			entries?: VfsListEntry[];
			error?: string;
		};
		if (!res.ok) {
			setError(data.error ?? "Failed to list directory");
			return;
		}
		setItems((prev) => {
			const next = { ...prev };
			mergeEntries(next, itemId, data.entries ?? []);
			return next;
		});
	}

	async function openFile(path: string) {
		if (!role || !personaId) return;
		const params = sessionQuery(role, personaId, ticketId);
		params.set("path", path);
		const res = await fetch(`/api/vfs/read?${params.toString()}`);
		const data = (await res.json()) as {
			content?: string;
			error?: string;
			path?: string;
		};
		if (!res.ok) {
			setError(data.error ?? "Failed to read file");
			return;
		}
		onFileOpen?.({
			path: data.path ?? path,
			content: data.content ?? "",
		});
	}

	if (!ready) {
		return (
			<p className="p-4 text-muted-foreground text-sm">
				Select a role and persona to load the VFS.
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-2 p-2">
			{error ? <p className="px-2 text-destructive text-xs">{error}</p> : null}
			<VfsTreeView
				key={treeKey}
				items={items}
				onExpandFolder={expandFolder}
				onOpenFile={openFile}
			/>
		</div>
	);
}

function VfsTreeView({
	items,
	onExpandFolder,
	onOpenFile,
}: {
	items: Record<string, FileItem>;
	onExpandFolder: (path: string, itemId: string) => void;
	onOpenFile: (path: string) => void;
}) {
	const itemsRef = useRef(items);
	itemsRef.current = items;

	const tree = useTree<FileItem>({
		initialState: {
			expandedItems: [ROOT_ID],
		},
		indent,
		rootItemId: ROOT_ID,
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => item.getItemData()?.type === "directory",
		dataLoader: {
			getItem: (itemId) => itemsRef.current[itemId] ?? { name: itemId },
			getChildren: (itemId) => itemsRef.current[itemId]?.children ?? [],
		},
		features: [syncDataLoaderFeature, hotkeysCoreFeature],
	});

	// Expand/list updates mutate `items` without remounting — refresh tree cache.
	useEffect(() => {
		tree.rebuildTree();
	}, [items, tree]);

	return (
		<Tree className="p-0" indent={indent} tree={tree}>
			{tree.getItems().map((item) => {
				const data = item.getItemData();
				const isFolder = item.isFolder();
				const isExpanded = item.isExpanded();
				const isJson = data.type === "json" || data.name.endsWith(".json");
				const isMd = data.type === "md" || data.name.endsWith(".md");

				return (
					<TreeItem
						item={item}
						key={item.getId()}
						onClick={(event) => {
							if (isFolder) {
								event.stopPropagation();
								if (!isExpanded && data.path) {
									void onExpandFolder(data.path, item.getId());
								}
								return;
							}
							if (!data.path) return;
							event.stopPropagation();
							void onOpenFile(data.path);
						}}
						onMouseDown={(event) => {
							if (isFolder || !data.path) return;
							event.stopPropagation();
						}}
					>
						<TreeItemLabel>
							<span className="flex items-center gap-2">
								{isFolder ? (
									isExpanded ? (
										<FolderOpenIcon className="size-4 text-muted-foreground" />
									) : (
										<FolderIcon className="size-4 text-muted-foreground" />
									)
								) : isJson ? (
									<BracesIcon className="size-4 text-muted-foreground" />
								) : isMd ? (
									<FileIcon className="size-4 text-muted-foreground" />
								) : (
									<FileIcon className="size-4 text-muted-foreground" />
								)}
								<span className="truncate">{item.getItemName()}</span>
							</span>
						</TreeItemLabel>
					</TreeItem>
				);
			})}
		</Tree>
	);
}

function mergeEntries(
	items: Record<string, FileItem>,
	parentId: string,
	entries: VfsListEntry[],
) {
	const parent = items[parentId] ?? {
		name: parentId,
		children: [],
		type: "directory" as const,
		path: parentId,
	};
	const childIds: string[] = [];
	for (const entry of entries) {
		const id = entry.path;
		childIds.push(id);
		if (entry.kind === "directory") {
			items[id] = {
				name: entry.name,
				children: items[id]?.children ?? [],
				type: "directory",
				path: entry.path,
			};
		} else {
			const type = entry.name.endsWith(".json")
				? "json"
				: entry.name.endsWith(".md")
					? "md"
					: "file";
			items[id] = {
				name: entry.name,
				type,
				path: entry.path,
			};
		}
	}
	items[parentId] = {
		...parent,
		type: "directory",
		children: childIds,
	};
}
