"use client";

import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { BracesIcon, FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tree, TreeItem, TreeItemLabel } from "@/components/reui/tree";

import { useSessionStore } from "@/lib/session-store";
import type { VfsListEntry } from "@/lib/vfs/types";

interface FileItem {
	name: string;
	children?: string[];
	type?: "directory" | "file" | "json" | "md";
	path?: string;
	/** File is present in fsMap (agent has loaded content). */
	hydrated?: boolean;
}

export type VfsFilePreview = {
	path: string;
	content: string;
	hydrated: boolean;
};

type MirrorSnapshot = {
	revision: string;
	entriesByDirectory: Record<string, VfsListEntry[]>;
	hydratedPaths: string[];
};

const ROOT_ID = "marketplace";
const indent = 20;
const MIRROR_POLL_MS = 1500;

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

/** Build a full FileItem map from the mirror snapshot (no extra fetches). */
function itemsFromMirror(snapshot: MirrorSnapshot): Record<string, FileItem> {
	const hydrated = new Set(snapshot.hydratedPaths);
	const items = emptyRoot();
	const dirs = Object.keys(snapshot.entriesByDirectory);

	for (const dirPath of dirs) {
		if (!items[dirPath]) {
			items[dirPath] = {
				name: dirPath.split("/").pop() ?? dirPath,
				children: [],
				type: "directory",
				path: dirPath,
			};
		}
	}

	for (const [dirPath, entries] of Object.entries(
		snapshot.entriesByDirectory,
	)) {
		mergeEntries(items, dirPath, entries, hydrated);
	}

	return items;
}

function allDirectoryIds(items: Record<string, FileItem>): string[] {
	return Object.entries(items)
		.filter(([, item]) => item.type === "directory")
		.map(([id]) => id);
}

export function VfsTree({
	onFileOpen,
}: {
	onFileOpen?: (preview: VfsFilePreview) => void;
}) {
	const { role, personaId, ticketId } = useSessionStore();
	const [items, setItems] = useState<Record<string, FileItem>>(emptyRoot);
	const [revision, setRevision] = useState<string>("");
	const [treeKey, setTreeKey] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const ready = Boolean(role && personaId && (role !== "SUPPORT" || ticketId));
	const revisionRef = useRef(revision);
	revisionRef.current = revision;

	useEffect(() => {
		if (!ready || !role || !personaId) {
			setItems(emptyRoot());
			setRevision("");
			setTreeKey((k) => k + 1);
			return;
		}

		let cancelled = false;
		const params = sessionQuery(role, personaId, ticketId);

		async function pullMirror(forceKeyBump: boolean) {
			try {
				const res = await fetch(`/api/vfs/mirror?${params.toString()}`);
				const data = (await res.json()) as MirrorSnapshot & {
					error?: string;
				};
				if (!res.ok) {
					throw new Error(data.error ?? "Failed to load VFS mirror");
				}
				if (cancelled) return;

				setError(null);
				const prevRevision = revisionRef.current;
				if (!forceKeyBump && data.revision === prevRevision) {
					return;
				}

				const next = itemsFromMirror(data);
				setItems(next);
				setRevision(data.revision);
				setTreeKey((k) => k + 1);
			} catch (err) {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : "VFS mirror failed");
				}
			}
		}

		void pullMirror(true);
		const timer = setInterval(() => {
			void pullMirror(false);
		}, MIRROR_POLL_MS);

		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [ready, role, personaId, ticketId]);

	function openFile(path: string, hydrated: boolean | undefined) {
		if (!role || !personaId) return;

		if (!hydrated) {
			onFileOpen?.({
				path,
				hydrated: false,
				content:
					"Not hydrated yet.\n\nThis VFS panel is a read-only mirror of what the agent has requested. Open this path with the agent (list_directory / read) to load it here.",
			});
			return;
		}

		const params = sessionQuery(role, personaId, ticketId);
		params.set("path", path);
		void (async () => {
			const res = await fetch(`/api/vfs/mirror?${params.toString()}`);
			const data = (await res.json()) as {
				hydrated?: boolean;
				content?: string;
				error?: string;
				path?: string;
			};
			if (!res.ok) {
				setError(data.error ?? "Failed to peek file");
				return;
			}
			if (!data.hydrated) {
				onFileOpen?.({
					path: data.path ?? path,
					hydrated: false,
					content:
						"Not hydrated yet.\n\nThis VFS panel is a read-only mirror of what the agent has requested. Open this path with the agent (list_directory / read) to load it here.",
				});
				return;
			}
			onFileOpen?.({
				path: data.path ?? path,
				hydrated: true,
				content: data.content ?? "",
			});
		})();
	}

	const expandedItems = useMemo(() => allDirectoryIds(items), [items]);

	if (!ready) {
		return (
			<p className="p-4 text-muted-foreground text-sm">
				Select a role and persona to load the VFS.
			</p>
		);
	}

	const hasAnyChildren = (items[ROOT_ID]?.children?.length ?? 0) > 0;

	return (
		<div className="flex flex-col gap-2 p-2">
			{error ? <p className="px-2 text-destructive text-xs">{error}</p> : null}
			{!hasAnyChildren ? (
				<p className="px-2 text-muted-foreground text-xs">
					Loading session folders…
				</p>
			) : null}
			<VfsTreeView
				key={treeKey}
				expandedItems={expandedItems}
				items={items}
				onOpenFile={openFile}
			/>
		</div>
	);
}

function VfsTreeView({
	items,
	expandedItems,
	onOpenFile,
}: {
	items: Record<string, FileItem>;
	expandedItems: string[];
	onOpenFile: (path: string, hydrated: boolean | undefined) => void;
}) {
	const itemsRef = useRef(items);
	itemsRef.current = items;

	const tree = useTree<FileItem>({
		initialState: {
			expandedItems,
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

				return (
					<TreeItem
						item={item}
						key={item.getId()}
						onClick={(event) => {
							if (isFolder) {
								// Folders only toggle expand locally — never fetch/hydrate.
								return;
							}
							if (!data.path) return;
							event.stopPropagation();
							onOpenFile(data.path, data.hydrated);
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
									<BracesIcon
										className={`size-4 ${data.hydrated ? "text-muted-foreground" : "text-muted-foreground/40"}`}
									/>
								) : (
									<FileIcon
										className={`size-4 ${data.hydrated ? "text-muted-foreground" : "text-muted-foreground/40"}`}
									/>
								)}
								<span
									className={
										!isFolder && !data.hydrated
											? "truncate text-muted-foreground/70"
											: "truncate"
									}
								>
									{item.getItemName()}
								</span>
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
	hydrated: Set<string>,
) {
	const parent = items[parentId] ?? {
		name: parentId.split("/").pop() ?? parentId,
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
				hydrated: hydrated.has(entry.path),
			};
		}
	}
	items[parentId] = {
		...parent,
		type: "directory",
		children: childIds,
	};
}
