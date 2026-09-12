import { tool } from "ai";
import { z } from "zod";

import { checkToolPath } from "@/lib/agent/guardrails";
import type { ToolTraceSink } from "@/lib/agent/tools/types";
import type { VfsController } from "@/lib/vfs/controller";

export function createReadTool(
	controller: VfsController,
	onTrace?: ToolTraceSink,
) {
	return tool({
		description:
			"Read a VFS file by path. Domain records are markdown with YAML frontmatter; agent-output files are JSON.",
		inputSchema: z.object({
			path: z.string().describe("Allowed file path to read"),
		}),
		execute: async ({ path }) => {
			const gated = checkToolPath("read", path);
			if (!gated.ok) {
				onTrace?.({ tool: "read", ok: false, errorMessage: gated.toolError });
				return { ok: false as const, error: gated.toolError };
			}
			try {
				const content = await controller.read(gated.path);
				onTrace?.({ tool: "read", ok: true });
				return { ok: true as const, path: gated.path, content };
			} catch (error) {
				const message = error instanceof Error ? error.message : "read failed";
				onTrace?.({ tool: "read", ok: false, errorMessage: message });
				return { ok: false as const, error: message };
			}
		},
	});
}
