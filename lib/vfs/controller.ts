import { initialTargetPaths, VfsDbAdapter } from "@/lib/vfs/adapter";
import { listFromIndex } from "@/lib/vfs/directory-index";
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

export class VfsController {
  protected readonly fsMap: VfsFileMap; // flat map of all files by path
  protected readonly directoryIndex: VfsDirectoryIndex; // index of all directories by path (lookup)
  private readonly adapter: VfsDbAdapter; // adapter DB <-> VFS memory bridge
  private readonly heuristic: VfsHeuristicProcessor; // heuristic insertions into DB for agent output
  private initialHydrationDone = false;

  constructor(private readonly session: VfsSession) {
    this.fsMap = new Map();
    this.directoryIndex = new Map();
    this.adapter = new VfsDbAdapter(this.fsMap, this.directoryIndex, session);
    this.heuristic = new VfsHeuristicProcessor(session, this.adapter);
  }

  async ensureHydrated(): Promise<void> {
    if (this.initialHydrationDone) {
      return;
    }
    const targetPaths = await initialTargetPaths(this.session);
    await this.adapter.hydrate({ ...this.session, targetPaths });
    this.initialHydrationDone = true;
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
    this.initialHydrationDone = false;
  }

  /** Peek index without forcing hydrate (tests / debug). */
  peekList(path: VfsPathString): VfsListEntry[] {
    return listFromIndex(this.directoryIndex, path);
  }
}
