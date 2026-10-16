import { NextResponse } from "next/server";

import { captureServerError, flushAnalytics } from "@/lib/analytics/posthog";
import { jsonError } from "@/lib/api-error";

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError(400, "Invalid JSON body");
	}

	const record =
		body && typeof body === "object"
			? (body as Record<string, unknown>)
			: null;
	const message =
		record && typeof record.message === "string" ? record.message.trim() : "";
	if (!message) {
		return jsonError(400, "Missing message");
	}

	const stack =
		record && typeof record.stack === "string" ? record.stack : undefined;
	const digest =
		record && typeof record.digest === "string" ? record.digest : undefined;

	captureServerError({
		scope: "Render crash",
		message,
		stack,
		digest,
	});
	await flushAnalytics();
	return NextResponse.json({ ok: true });
}
