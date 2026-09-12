import { NextResponse } from "next/server";

import { isRole } from "@/lib/types";
import { VfsPath } from "@/lib/vfs/paths";
import { VfsSessionScope } from "@/lib/vfs/session";
import { VfsStore } from "@/lib/vfs/store";
import type { VfsSession } from "@/lib/vfs/types";

function parseVfsListRequest(url: URL): VfsSession | { error: string } {
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

export async function GET(request: Request) {
	const url = new URL(request.url);
	const sessionOrError = parseVfsListRequest(url);
	if ("error" in sessionOrError) {
		return NextResponse.json({ error: sessionOrError.error }, { status: 400 });
	}

	const path =
		VfsPath.normalize(url.searchParams.get("path") ?? VfsPath.root()) ||
		VfsPath.root();
	const reset = url.searchParams.get("reset") === "1";

	try {
		if (reset) {
			VfsStore.reset(sessionOrError);
		}
		const store = VfsStore.forSession(sessionOrError);
		const entries = await store.listChildren(path);
		return NextResponse.json({ path, entries });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to list VFS path";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
