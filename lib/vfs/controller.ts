import { initialTargetPaths, VfsDbAdapter } from "@/lib/vfs/adapter";
import { indexDirectoryPath, listFromIndex } from "@/lib/vfs/directory-index";
import { VfsHeuristicProcessor } from "@/lib/vfs/heuristic";
import { VfsPath } from "@/lib/vfs/paths";
import type {
	VfsDirectoryIndex,
	VfsFileMap,
	VfsListEntry,
	VfsPath as VfsPathString,
	VfsSearchHit,
	VfsSearchQuery,
	VfsSession,
	VfsWriteResult,
} from "@/lib/vfs/types";

/** Read-only UI snapshot of `initialTargetPaths` + agent-loaded VFS. */
export type VfsMirrorSnapshot = {
	/** Changes when index or hydrated file set changes. */
	revision: string;
	/** Immediate children currently known for each directory path. */
	entriesByDirectory: Record<string, VfsListEntry[]>;
	/** Paths present in fsMap (agent has read/written content). */
	hydratedPaths: string[];
};

export class VfsController {
	protected readonly fsMap: VfsFileMap; // flat map of all files by path
	protected readonly directoryIndex: VfsDirectoryIndex; // index of all directories by path (lookup)
	private readonly adapter: VfsDbAdapter; // adapter DB <-> VFS memory bridge
	private readonly heuristic: VfsHeuristicProcessor; // heuristic insertions into DB for agent output
	private initialTargetPathsMounted = false;
	/** Session bootstrap: mount `initialTargetPaths` directories only. Started in the constructor. */
	private readonly boot: Promise<void>;

	constructor(private readonly session: VfsSession) {
		this.fsMap = new Map();
		this.directoryIndex = new Map();
		this.adapter = new VfsDbAdapter(this.fsMap, this.directoryIndex, session);
		this.heuristic = new VfsHeuristicProcessor(this.adapter);
		this.boot = this.ensureInitialTargetPaths();
	}

	/**
	 * Mount `initialTargetPaths` directories only (no domain file contents).
	 * e.g. CUSTOMER → marketplace / agent-output / customers / customers/{id}.
	 * Does not load profile.md, products/, orders/, etc. — those appear when the agent lists/reads.
	 */
	async ensureInitialTargetPaths(): Promise<void> {
		if (this.initialTargetPathsMounted) {
			return;
		}
		const targetPaths = await initialTargetPaths(this.session);
		for (const path of targetPaths) {
			const normalized = VfsPath.normalize(path);
			if (VfsPath.isDirectory(normalized)) {
				indexDirectoryPath(this.directoryIndex, normalized);
			}
		}
		this.initialTargetPathsMounted = true;
	}

	/** Await constructor `initialTargetPaths` mount (idempotent). JIT hydrate stays on list/read. */
	async ensureHydrated(): Promise<void> {
		await this.boot;
	}

	async read(path: VfsPathString): Promise<string> {
		await this.ensureHydrated();
		const normalized = VfsPath.normalize(path);
		VfsPath.assertValidToolPath("read", normalized);

		if (VfsPath.isDirectory(normalized)) {
			throw new Error(`Cannot read directory as file: ${normalized}`);
		}

		const content = await this.adapter.ensureFileHydrated(normalized);
		if (content === null) {
			throw new Error(`File not found or not visible: ${normalized}`);
		}
		return content;
	}

	async write(path: VfsPathString, content: string): Promise<VfsWriteResult> {
		await this.ensureHydrated();
		const normalized = VfsPath.normalize(path);
		VfsPath.assertValidToolPath("write", normalized);

		if (this.fsMap.has(normalized)) {
			throw new Error(`File already exists (no overwrite): ${normalized}`);
		}

		// Create-only into VFS, then heuristic applies DB + refresh.
		this.adapter.putFile(normalized, content);
		await this.heuristic.processAgentOutput(this.session, content);
		return { success: true };
	}

	async listDirectory(path: VfsPathString): Promise<VfsListEntry[]> {
		await this.ensureHydrated();
		const normalized = VfsPath.normalize(path);
		return this.adapter.ensureDirectoryListed(normalized);
	}

	async search(query: VfsSearchQuery): Promise<VfsSearchHit[]> {
		await this.ensureHydrated();
		const directoryPath = VfsPath.normalize(query.directoryPath);
		VfsPath.assertValidToolPath("search", directoryPath);

		const entries = await this.adapter.ensureDirectoryListed(directoryPath);
		const needle = query.query.toLowerCase();
		const hits: VfsSearchHit[] = [];

		for (const entry of entries) {
			if (entry.kind !== "file") {
				continue;
			}
			const content = await this.adapter.ensureFileHydrated(entry.path);
			if (content === null) {
				continue;
			}
			const lower = content.toLowerCase();
			const idx = lower.indexOf(needle);
			if (idx === -1) {
				continue;
			}
			const start = Math.max(0, idx - 40);
			const end = Math.min(content.length, idx + needle.length + 40);
			hits.push({
				path: entry.path,
				match: content.slice(start, end).replace(/\s+/g, " ").trim(),
			});
		}

		return hits;
	}

	reset(): void {
		this.fsMap.clear();
		this.directoryIndex.clear();
		this.initialTargetPathsMounted = false;
	}

	/**
	 * UI mirror: list whatever is already in the directory index.
	 * Does not hydrate from the DB.
	 */
	peekList(path: VfsPathString): VfsListEntry[] {
		return listFromIndex(this.directoryIndex, VfsPath.normalize(path));
	}

	/**
	 * UI mirror: `initialTargetPaths` directories + anything the agent has loaded since.
	 * Does not hydrate further from the DB.
	 */
	async peekMirror(): Promise<VfsMirrorSnapshot> {
		await this.boot;
		const entriesByDirectory: Record<string, VfsListEntry[]> = {};
		for (const dirPath of this.directoryIndex.keys()) {
			entriesByDirectory[dirPath] = listFromIndex(
				this.directoryIndex,
				dirPath,
			);
		}
		const hydratedPaths = [...this.fsMap.keys()].sort();
		const dirKeys = Object.keys(entriesByDirectory).sort();
		const revision = [
			`d:${dirKeys.length}`,
			...dirKeys.map(
				(k) => `${k}=${entriesByDirectory[k]?.map((e) => e.path).join(",")}`,
			),
			`f:${hydratedPaths.join(",")}`,
		].join("|");

		return { revision, entriesByDirectory, hydratedPaths };
	}

	/**
	 * UI mirror: return in-memory file content only.
	 * Does not hydrate from the DB.
	 */
	peekRead(path: VfsPathString): { hydrated: true; content: string } | {
		hydrated: false;
	} {
		const normalized = VfsPath.normalize(path);
		const content = this.fsMap.get(normalized);
		if (content === undefined) {
			return { hydrated: false };
		}
		return { hydrated: true, content };
	}
}
