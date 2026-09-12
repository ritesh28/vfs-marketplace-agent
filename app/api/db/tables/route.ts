import { NextResponse } from "next/server";

import { listTableNames } from "@/lib/db/queries";

export async function GET() {
	try {
		return NextResponse.json({ tables: listTableNames() });
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to list tables";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
