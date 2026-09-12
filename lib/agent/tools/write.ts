import { tool } from "ai";
import { z } from "zod";

import { checkToolPath } from "@/lib/agent/guardrails";
import type { ToolTraceSink } from "@/lib/agent/tools/types";
import type { VfsController } from "@/lib/vfs/controller";

export function createWriteTool(
	controller: VfsController,
	onTrace?: ToolTraceSink,
) {
	return tool({
		description:
			"Create-only write of JSON under marketplace/agent-output/output-N.json. No overwrite, append, or rename. Heuristic validates and updates the DB.",
		inputSchema: z.object({
			path: z
				.string()
				.describe("marketplace/agent-output/output-N.json (N = 1, 2, …)"),
			content: z
				.string()
				.describe("JSON string body for the agent-output file"),
		}),
		execute: async ({ path, content }) => {
			const gated = checkToolPath("write", path);
			if (!gated.ok) {
				onTrace?.({ tool: "write", ok: false, errorMessage: gated.toolError });
				return { ok: false as const, error: gated.toolError };
			}
			try {
				const result = await controller.write(gated.path, content);
				onTrace?.({ tool: "write", ok: true });
				return { ok: true as const, ...result };
			} catch (error) {
				const message = error instanceof Error ? error.message : "write failed";
				onTrace?.({ tool: "write", ok: false, errorMessage: message });
				return { ok: false as const, error: message };
			}
		},
	});
}
