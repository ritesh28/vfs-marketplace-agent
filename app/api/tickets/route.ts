import { NextResponse } from "next/server";

import { jsonError, logServerError } from "@/lib/api-error";
import { UNEXPECTED_ERROR_MESSAGE } from "@/lib/error-messages";

export async function GET() {
	try {
		const { listTicketSummaries } = await import("@/lib/db/queries");
		const tickets = await listTicketSummaries();
		return NextResponse.json(tickets);
	} catch (error) {
		await logServerError("Failed to list tickets", error);
		return jsonError(500, UNEXPECTED_ERROR_MESSAGE);
	}
}
