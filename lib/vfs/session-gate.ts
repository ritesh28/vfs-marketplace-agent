import type { Role } from "@/lib/db/types";
import type { VfsSession } from "@/lib/vfs/types";

/** Client-safe session readiness (no DB imports). */
export function isSessionReady(session: {
	role: Role | null;
	personaId: string | null;
	ticketId: string | null;
}): session is VfsSession {
	if (!session.role || !session.personaId) {
		return false;
	}
	if (session.role === "SUPPORT" && !session.ticketId) {
		return false;
	}
	return true;
}

export function vfsSessionKey(session: VfsSession): string {
	return `${session.role}:${session.personaId}:${session.ticketId ?? ""}`;
}
