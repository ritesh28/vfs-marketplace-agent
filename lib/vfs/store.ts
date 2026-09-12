import { VfsController } from "@/lib/vfs/controller";
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

  async listChildren(path: string): Promise<VfsListEntry[]> {
    return this.controller.listDirectory(VfsPath.normalize(path));
  }

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

  getController(): VfsController {
    return this.controller;
  }
}
