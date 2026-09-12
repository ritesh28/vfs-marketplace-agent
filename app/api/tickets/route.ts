import { NextResponse } from "next/server";

import { listTicketSummaries } from "@/lib/db/queries";

export async function GET() {
	try {
		const tickets = await listTicketSummaries();
		return NextResponse.json(tickets);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to list tickets";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
