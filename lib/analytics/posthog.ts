import { PostHog } from "posthog-node";

import type { AiProvider, ProviderModelId, Role } from "@/lib/types";
import type { VfsToolName } from "@/lib/vfs/types";

export type AgentTraceTokenUsage = {
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
};

export type AgentTraceToolCall = {
	tool: VfsToolName;
	ok: boolean;
	errorMessage?: string;
};

type TraceBase = {
	requestId: string;
	provider: AiProvider;
	modelId: ProviderModelId;
	role: Role;
	personaId: string;
	ticketId: string | null;
};

let client: PostHog | null | undefined;

function parseTracingHeaders(): Record<string, string> | undefined {
	const raw = process.env.POSTHOG_TRACING_HEADER?.trim();
	if (!raw) {
		return undefined;
	}

	if (raw.startsWith("{")) {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				const headers: Record<string, string> = {};
				for (const [key, value] of Object.entries(parsed)) {
					if (typeof value === "string") {
						headers[key] = value;
					}
				}
				return Object.keys(headers).length > 0 ? headers : undefined;
			}
		} catch {
			// fall through to Header:value / HeaderName forms
		}
	}

	const colon = raw.indexOf(":");
	if (colon > 0) {
		const name = raw.slice(0, colon).trim();
		const value = raw.slice(colon + 1).trim();
		if (name) {
			return { [name]: value || "1" };
		}
	}

	return { [raw]: "1" };
}

/** posthog-node has no `tracing_headers` option; apply via custom fetch. */
function createClient(): PostHog | null {
	const apiKey = process.env.POSTHOG_KEY?.trim();
	if (!apiKey) {
		return null;
	}

	const host = process.env.POSTHOG_HOST?.trim() || undefined;
	const tracingHeaders = parseTracingHeaders();

	return new PostHog(apiKey, {
		host,
		flushAt: 1,
		flushInterval: 0,
		...(tracingHeaders
			? {
					fetch: async (url, options) => {
						const headers = new Headers(options.headers);
						for (const [name, value] of Object.entries(tracingHeaders)) {
							headers.set(name, value);
						}
						return fetch(url, { ...options, headers });
					},
				}
			: {}),
	});
}

function getClient(): PostHog | null {
	if (client === undefined) {
		client = createClient();
	}
	return client;
}

function capture(
	event: string,
	properties: Record<string, unknown>,
	distinctId = "vfs-marketplace-agent",
): void {
	const ph = getClient();
	if (!ph) {
		return;
	}
	ph.capture({
		distinctId,
		event,
		properties,
	});
}

export function captureChatStart(base: TraceBase): void {
	capture("agent_chat_start", {
		kind: "agent_chat_start",
		...base,
	});
}

export function captureChatEnd(
	base: TraceBase & {
		usage?: AgentTraceTokenUsage;
		toolCalls?: AgentTraceToolCall[];
	},
): void {
	capture("agent_chat_end", {
		kind: "agent_chat_end",
		requestId: base.requestId,
		provider: base.provider,
		modelId: base.modelId,
		role: base.role,
		personaId: base.personaId,
		ticketId: base.ticketId,
		usage: base.usage,
		toolCalls: base.toolCalls,
	});
}

export function captureChatError(
	base: Partial<TraceBase> & {
		provider: AiProvider;
		message: string;
	},
): void {
	capture("agent_chat_error", {
		kind: "agent_chat_error",
		requestId: base.requestId,
		provider: base.provider,
		modelId: base.modelId,
		role: base.role,
		personaId: base.personaId,
		ticketId: base.ticketId,
		message: base.message,
	});
}

export function captureToolCall(base: TraceBase & AgentTraceToolCall): void {
	capture("agent_tool_call", {
		kind: "agent_tool_call",
		requestId: base.requestId,
		provider: base.provider,
		modelId: base.modelId,
		role: base.role,
		personaId: base.personaId,
		ticketId: base.ticketId,
		tool: base.tool,
		ok: base.ok,
		errorMessage: base.errorMessage,
	});
}

/** Best-effort flush for serverless / route end. */
export async function flushAnalytics(): Promise<void> {
	const ph = getClient();
	if (!ph) {
		return;
	}
	await ph.flush();
}
