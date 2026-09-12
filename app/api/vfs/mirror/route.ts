import { NextResponse } from "next/server";

import { isRole } from "@/lib/types";
import { VfsSessionScope } from "@/lib/vfs/session";
import { VfsStore } from "@/lib/vfs/store";
import type { VfsSession } from "@/lib/vfs/types";

function parseVfsMirrorRequest(url: URL): VfsSession | { error: string } {
	const role = url.searchParams.get("role");
	const personaId = url.searchParams.get("personaId");
	const ticketId = url.searchParams.get("ticketId");

	if (!role || !isRole(role)) {
		return { error: "Missing or invalid role" };
	}
	if (!personaId) {
		return { error: "Missing personaId" };
	}
	if (role === "SUPPORT" && !ticketId) {
		return { error: "Missing ticketId for support session" };
	}

	const session = {
		role,
		personaId,
		ticketId: role === "SUPPORT" ? ticketId : null,
	};

	if (!VfsSessionScope.isReady(session)) {
		return { error: "Incomplete VFS session" };
	}

	return session;
}

/**
 * Read-only mirror of the in-memory VFS for the UI.
 * Never hydrates from the DB — only reflects what the agent has already loaded.
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const sessionOrError = parseVfsMirrorRequest(url);
	if ("error" in sessionOrError) {
		return NextResponse.json({ error: sessionOrError.error }, { status: 400 });
	}

	try {
		const store = VfsStore.forSession(sessionOrError);
		const path = url.searchParams.get("path");
		if (path) {
			return NextResponse.json({
				path: path,
				...store.peekRead(path),
			});
		}
		return NextResponse.json(store.peekMirror());
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to mirror VFS";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
