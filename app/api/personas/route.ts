import { NextResponse } from "next/server";

import { listPersonasByRole } from "@/lib/db/queries";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["customer", "seller", "support"];

function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

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
      { error: `Invalid role: ${role}. Expected customer, seller, or support.` },
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
