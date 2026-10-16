import { NextResponse } from "next/server";

import { captureServerError, flushAnalytics } from "@/lib/analytics/posthog";

export function jsonError(status: number, message: string) {
	return NextResponse.json({ error: message }, { status });
}

export async function logServerError(
	scope: string,
	error: unknown,
): Promise<void> {
	console.error(scope, error);
	captureServerError({
		scope,
		message: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
	});
	await flushAnalytics();
}
