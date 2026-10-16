import { NextResponse } from "next/server";

import { jsonError, logServerError } from "@/lib/api-error";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/error-messages";
import { isRole } from "@/lib/types";
import { VfsSessionScope } from "@/lib/vfs/session";
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
 * Mounts `initialTargetPaths` directories; never hydrates file contents from the DB.
 */
export async function GET(request: Request) {
	const url = new URL(request.url);
	const sessionOrError = parseVfsMirrorRequest(url);
	if ("error" in sessionOrError) {
		return jsonError(400, sessionOrError.error);
	}

	try {
		const { VfsStore } = await import("@/lib/vfs/store");
		const store = VfsStore.forSession(sessionOrError);
		const path = url.searchParams.get("path");
		if (path) {
			return NextResponse.json({
				path: path,
				...store.peekRead(path),
			});
		}
		return NextResponse.json(await store.peekMirror());
	} catch (error) {
		await logServerError("Failed to mirror VFS", error);
		return jsonError(500, UNEXPECTED_ERROR_MESSAGE);
	}
}
