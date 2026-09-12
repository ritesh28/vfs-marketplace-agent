import { VfsPath } from "@/lib/vfs/paths";
import type {
	VfsDirEntryToken,
	VfsDirectoryIndex,
	VfsListEntry,
	VfsPath as VfsPathString,
} from "@/lib/vfs/types";

export function fileToken(name: string): VfsDirEntryToken {
	return `file:${name}`;
}

export function directoryToken(name: string): VfsDirEntryToken {
	return `directory:${name}`;
}

export function parseDirEntryToken(token: VfsDirEntryToken): {
	kind: "file" | "directory";
	name: string;
} {
	if (token.startsWith("file:")) {
		return { kind: "file", name: token.slice("file:".length) };
	}
	if (token.startsWith("directory:")) {
		return { kind: "directory", name: token.slice("directory:".length) };
	}
	throw new Error(`Invalid directory index token: ${token}`);
}

/** Register a file path into the directory index via bubble-up parent directories. */
export function indexFilePath(
	directoryIndex: VfsDirectoryIndex,
	filePath: VfsPathString,
): void {
	const normalized = VfsPath.normalize(filePath);
	const parts = normalized.split("/");
	for (let i = parts.length - 1; i >= 1; i -= 1) {
		const parent = VfsPath.normalize(parts.slice(0, i).join("/"));
		const childName = parts[i];
		if (childName === undefined) {
			continue;
		}
		const isFileLevel = i === parts.length - 1;
		const token = isFileLevel
			? fileToken(childName)
			: directoryToken(childName);
		let set = directoryIndex.get(parent);
		if (!set) {
			set = new Set();
			directoryIndex.set(parent, set);
		}
		set.add(token);
	}
}

/** Ensure a directory exists in the index under its parent (even if empty of files). */
export function indexDirectoryPath(
	directoryIndex: VfsDirectoryIndex,
	directoryPath: VfsPathString,
): void {
	const normalized = VfsPath.normalize(directoryPath);
	if (normalized === VfsPath.root()) {
		if (!directoryIndex.has(normalized)) {
			directoryIndex.set(normalized, new Set());
		}
		return;
	}
	const parts = normalized.split("/");
	for (let i = parts.length - 1; i >= 1; i -= 1) {
		const parent = VfsPath.normalize(parts.slice(0, i).join("/"));
		const childName = parts[i];
		if (childName === undefined) {
			continue;
		}
		const token = directoryToken(childName);
		let set = directoryIndex.get(parent);
		if (!set) {
			set = new Set();
			directoryIndex.set(parent, set);
		}
		set.add(token);
	}
	if (!directoryIndex.has(normalized)) {
		directoryIndex.set(normalized, new Set());
	}
}

export function listFromIndex(
	directoryIndex: VfsDirectoryIndex,
	directoryPath: VfsPathString,
): VfsListEntry[] {
	const parent = VfsPath.normalize(directoryPath);
	const set = directoryIndex.get(parent);
	if (!set) {
		return [];
	}

	const entries: VfsListEntry[] = [];
	for (const token of set) {
		const { kind, name } = parseDirEntryToken(token);
		entries.push({
			name,
			kind,
			path: VfsPath.join(parent, name),
		});
	}

	entries.sort((a, b) => {
		if (a.kind !== b.kind) {
			return a.kind === "directory" ? -1 : 1;
		}
		return a.name.localeCompare(b.name);
	});

	return entries;
}
