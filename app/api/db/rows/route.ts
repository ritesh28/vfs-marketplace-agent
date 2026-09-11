import { NextResponse } from "next/server";

import { getTableRows, isDbTableName } from "@/lib/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");

  if (!table) {
    return NextResponse.json(
      { error: "Missing required query parameter: table" },
      { status: 400 },
    );
  }

  if (!isDbTableName(table)) {
    return NextResponse.json({ error: `Unknown table: ${table}` }, { status: 400 });
  }

  try {
    const rows = await getTableRows(table);
    return NextResponse.json({ table, rows });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch rows";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
