import { readFile } from "node:fs/promises";
import path from "node:path";

import type { VfsSession } from "@/lib/vfs/types";

const INSTRUCTIONS_PATH = path.join(
	process.cwd(),
	"lib/agent/system-instructions.md",
);

let cachedInstructions: string | null = null;

async function loadSystemInstructions(): Promise<string> {
	if (cachedInstructions !== null) {
		return cachedInstructions;
	}
	cachedInstructions = await readFile(INSTRUCTIONS_PATH, "utf8");
	return cachedInstructions;
}

/** Build system prompt from rewritten instructions + active session. */
export async function buildSystemPrompt(session: VfsSession): Promise<string> {
	const base = await loadSystemInstructions();
	return `${base.trim()}

---

## Active session (injected)

- role: \`${session.role}\`
- personaId: \`${session.personaId}\`
- ticketId: \`${session.ticketId ?? "(none)"}\`

Only act within this persona's VFS scope and write allow list. Do not invent paths or ids.
`;
}
