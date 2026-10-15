import {
	captureGenericDatabaseError,
	flushAnalytics,
} from "@/lib/analytics/posthog";

export async function POST() {
	captureGenericDatabaseError();
	await flushAnalytics();
	return new Response(null, { status: 204 });
}
