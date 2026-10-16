import { NextResponse } from "next/server";

import { jsonError, logServerError } from "@/lib/api-error";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/error-messages";
import { isRole, ROLES } from "@/lib/types";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const role = searchParams.get("role");

	if (!role) {
		return jsonError(400, "Missing required query parameter: role");
	}

	if (!isRole(role)) {
		return jsonError(
			400,
			`Invalid role: ${role}. Expected ${ROLES.join(", ")}.`,
		);
	}

	try {
		const { listPersonasByRole } = await import("@/lib/db/queries");
		const personas = await listPersonasByRole(role);
		return NextResponse.json(personas);
	} catch (error) {
		await logServerError("Failed to list personas", error);
		return jsonError(500, UNEXPECTED_ERROR_MESSAGE);
	}
}
