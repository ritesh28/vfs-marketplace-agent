import { NextResponse } from "next/server";

import { isRole } from "@/lib/types";
import { VfsPath } from "@/lib/vfs/paths";
import { VfsSessionScope } from "@/lib/vfs/session";
import { VfsStore } from "@/lib/vfs/store";
import type { VfsSession } from "@/lib/vfs/types";

class VfsReadRequest {
  static parse(url: URL): VfsSession | { error: string } {
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
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionOrError = VfsReadRequest.parse(url);
  if ("error" in sessionOrError) {
    return NextResponse.json({ error: sessionOrError.error }, { status: 400 });
  }

  const pathParam = url.searchParams.get("path");
  if (!pathParam) {
    return NextResponse.json(
      { error: "Missing required query parameter: path" },
      { status: 400 },
    );
  }

  const path = VfsPath.normalize(pathParam);

  try {
    const store = VfsStore.forSession(sessionOrError);
    const content = await store.readFile(path);
    if (content === null) {
      return NextResponse.json(
        { error: `File not found or not visible: ${path}` },
        { status: 404 },
      );
    }
    return NextResponse.json({ path, content });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read VFS file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
