import { tool } from "ai";
import { z } from "zod";

import { checkToolPath } from "@/lib/agent/guardrails";
import type { ToolTraceSink } from "@/lib/agent/tools/types";
import type { VfsController } from "@/lib/vfs/controller";

export function createListDirectoryTool(
	controller: VfsController,
	onTrace?: ToolTraceSink,
) {
	return tool({
		description:
			"List immediate files and directories under an allowed VFS directory path (no leading slash). Triggers JIT hydration.",
		inputSchema: z.object({
			path: z
				.string()
				.describe("Allowed directory path, e.g. marketplace/customers/{id}"),
		}),
		execute: async ({ path }) => {
			const gated = checkToolPath("list_directory", path);
			if (!gated.ok) {
				onTrace?.({
					tool: "list_directory",
					ok: false,
					errorMessage: gated.toolError,
				});
				return { ok: false as const, error: gated.toolError };
			}
			try {
				const entries = await controller.listDirectory(gated.path);
				onTrace?.({ tool: "list_directory", ok: true });
				return { ok: true as const, path: gated.path, entries };
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "list_directory failed";
				onTrace?.({
					tool: "list_directory",
					ok: false,
					errorMessage: message,
				});
				return { ok: false as const, error: message };
			}
		},
	});
}
