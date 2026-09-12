import { tool } from "ai";
import { z } from "zod";

import { checkToolPath } from "@/lib/agent/guardrails";
import type { ToolTraceSink } from "@/lib/agent/tools/types";
import type { VfsController } from "@/lib/vfs/controller";

export function createSearchTool(
	controller: VfsController,
	onTrace?: ToolTraceSink,
) {
	return tool({
		description:
			"Case-insensitive substring search over file contents under an allowed directory. Both query and directory path are required.",
		inputSchema: z.object({
			query: z.string().describe("Substring to search for (case-insensitive)"),
			directoryPath: z
				.string()
				.describe("Allowed directory path to search under"),
		}),
		execute: async ({ query, directoryPath }) => {
			const gated = checkToolPath("search", directoryPath);
			if (!gated.ok) {
				onTrace?.({ tool: "search", ok: false, errorMessage: gated.toolError });
				return { ok: false as const, error: gated.toolError };
			}
			try {
				const hits = await controller.search({
					query,
					directoryPath: gated.path,
				});
				onTrace?.({ tool: "search", ok: true });
				return { ok: true as const, directoryPath: gated.path, hits };
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "search failed";
				onTrace?.({ tool: "search", ok: false, errorMessage: message });
				return { ok: false as const, error: message };
			}
		},
	});
}
