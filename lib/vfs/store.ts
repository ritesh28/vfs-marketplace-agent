import { VfsController, type VfsMirrorSnapshot } from "@/lib/vfs/controller";
import { VfsPath } from "@/lib/vfs/paths";
import { VfsSessionScope } from "@/lib/vfs/session";
import type { VfsListEntry, VfsSession } from "@/lib/vfs/types";

const controllers = new Map<string, VfsController>();

export class VfsStore {
	private constructor(private readonly controller: VfsController) {}

	static forSession(session: VfsSession): VfsStore {
		if (!VfsSessionScope.isReady(session)) {
			throw new Error("Incomplete VFS session");
		}
		const key = VfsSessionScope.sessionKey(session);
		let controller = controllers.get(key);
		if (!controller) {
			controller = new VfsController(session);
			controllers.set(key, controller);
		}
		return new VfsStore(controller);
	}

	static reset(session: VfsSession): void {
		const key = VfsSessionScope.sessionKey(session);
		const existing = controllers.get(key);
		if (existing) {
			existing.reset();
			controllers.delete(key);
		}
	}

	/** Agent / tools: list with JIT hydrate. */
	async listChildren(path: string): Promise<VfsListEntry[]> {
		return this.controller.listDirectory(VfsPath.normalize(path));
	}

	/** Agent / tools: read with JIT hydrate. */
	async readFile(path: string): Promise<string | null> {
		try {
			return await this.controller.read(VfsPath.normalize(path));
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.startsWith("File not found")
			) {
				return null;
			}
			throw error;
		}
	}

	/** UI: snapshot of `initialTargetPaths` + agent-loaded VFS (no file hydrate). */
	async peekMirror(): Promise<VfsMirrorSnapshot> {
		return this.controller.peekMirror();
	}

	/** UI: in-memory file only (no DB hydrate). */
	peekRead(path: string): { hydrated: true; content: string } | {
		hydrated: false;
	} {
		return this.controller.peekRead(VfsPath.normalize(path));
	}

	getController(): VfsController {
		return this.controller;
	}
}
