import { NextResponse } from "next/server";

import { listTableNames } from "@/lib/db/queries";

export async function GET() {
	return NextResponse.json({ tables: listTableNames() });
}
