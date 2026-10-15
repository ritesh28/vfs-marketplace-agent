import { NextResponse } from "next/server";

import { captureDatabaseError, flushAnalytics } from "@/lib/analytics/posthog";
import { getTableRows, isDbTableName } from "@/lib/db/queries";
import { AppError, errorResponse } from "@/lib/errors";

function fail(error: AppError) {
	const { status, body } = errorResponse(error);
	return NextResponse.json(body, { status });
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const table = searchParams.get("table");

	if (!table) {
		return fail(
			new AppError("invalid", {
				message: "Missing required query parameter: table",
			}),
		);
	}

	if (!isDbTableName(table)) {
		return fail(
			new AppError("invalid", { message: `Unknown table: ${table}` }),
		);
	}

	try {
		const rows = await getTableRows(table);
		return NextResponse.json({ table, rows });
	} catch (error) {
		captureDatabaseError(error);
		await flushAnalytics();
		return fail(new AppError("internal", { source: "database" }));
	}
}
