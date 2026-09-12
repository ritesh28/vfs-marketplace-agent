import { createListDirectoryTool } from "@/lib/agent/tools/list-directory";
import { createReadTool } from "@/lib/agent/tools/read";
import { createSearchTool } from "@/lib/agent/tools/search";
import type { ToolTraceSink } from "@/lib/agent/tools/types";
import { createWriteTool } from "@/lib/agent/tools/write";
import type { VfsController } from "@/lib/vfs/controller";

export type { ToolTraceSink } from "@/lib/agent/tools/types";

/** Bundle VFS tools bound to the session controller. */
export function createAgentTools(
	controller: VfsController,
	onTrace?: ToolTraceSink,
) {
	return {
		list_directory: createListDirectoryTool(controller, onTrace),
		read: createReadTool(controller, onTrace),
		write: createWriteTool(controller, onTrace),
		search: createSearchTool(controller, onTrace),
	};
}
