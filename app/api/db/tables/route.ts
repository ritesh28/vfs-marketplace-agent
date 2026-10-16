import { NextResponse } from "next/server";

import { jsonError, logServerError } from "@/lib/api-error";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/error-messages";

export async function GET() {
	try {
		const { listTableNames } = await import("@/lib/db/queries");
		return NextResponse.json({ tables: listTableNames() });
	} catch (error) {
		await logServerError("Failed to list tables", error);
		return jsonError(500, UNEXPECTED_ERROR_MESSAGE);
	}
}
