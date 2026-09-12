import { NextResponse } from "next/server";

import { listPersonasByRole } from "@/lib/db/queries";
import { isRole, ROLES } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  if (!role) {
    return NextResponse.json(
      { error: "Missing required query parameter: role" },
      { status: 400 },
    );
  }

  if (!isRole(role)) {
    return NextResponse.json(
      {
        error: `Invalid role: ${role}. Expected ${ROLES.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  try {
    const personas = await listPersonasByRole(role);
    return NextResponse.json(personas);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list personas";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
