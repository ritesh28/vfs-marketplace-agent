import { NextResponse } from "next/server";

import { jsonError, logServerError } from "@/lib/api-error";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/error-messages";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const table = searchParams.get("table");

	if (!table) {
		return jsonError(400, "Missing required query parameter: table");
	}

	try {
		const { getTableRows, isDbTableName } = await import("@/lib/db/queries");

		if (!isDbTableName(table)) {
			return jsonError(400, `Unknown table: ${table}`);
		}

		const rows = await getTableRows(table);
		return NextResponse.json({ table, rows });
	} catch (error) {
		await logServerError("Failed to fetch rows", error);
		return jsonError(500, UNEXPECTED_ERROR_MESSAGE);
	}
}
