import {
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	generateId,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";

import { checkUserMessage } from "@/lib/agent/guardrails";
import { buildSystemPrompt } from "@/lib/agent/instructions";
import {
	createLanguageModel,
	resolveProviderModel,
} from "@/lib/agent/providers";
import { createAgentTools } from "@/lib/agent/tools";
import {
	type AgentTraceToolCall,
	captureChatEnd,
	captureChatError,
	captureChatStart,
	captureToolCall,
	flushAnalytics,
} from "@/lib/analytics/posthog";
import { jsonError, logServerError } from "@/lib/api-error";
import {
	MODEL_REQUEST_FAILED_MESSAGE,
	UNEXPECTED_ERROR_MESSAGE,
} from "@/lib/error-messages";
import { isAiProvider } from "@/lib/provider-storage";
import { type AiProvider, isRole } from "@/lib/types";
import { VfsSessionScope } from "@/lib/vfs/session";
import type { VfsSession } from "@/lib/vfs/types";

type ChatBody = {
	messages?: UIMessage[];
	provider?: string;
	apiKey?: string;
	session?: {
		role?: string;
		personaId?: string;
		ticketId?: string | null;
	};
};

function extractLatestUserText(messages: UIMessage[]): string {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const message = messages[i];
		if (message?.role !== "user") {
			continue;
		}
		const textParts = message.parts
			.filter(
				(part): part is { type: "text"; text: string } => part.type === "text",
			)
			.map((part) => part.text);
		return textParts.join("\n").trim();
	}
	return "";
}

function assistantTextStreamResponse(text: string): Response {
	const textId = generateId();
	const stream = createUIMessageStream({
		execute({ writer }) {
			writer.write({ type: "start" });
			writer.write({ type: "text-start", id: textId });
			writer.write({ type: "text-delta", id: textId, delta: text });
			writer.write({ type: "text-end", id: textId });
			writer.write({ type: "finish", finishReason: "stop" });
		},
	});
	return createUIMessageStreamResponse({ stream });
}

function parseSession(
	raw: ChatBody["session"],
): VfsSession | { error: string } {
	if (!raw) {
		return { error: "Missing session" };
	}
	if (!raw.role || !isRole(raw.role)) {
		return { error: "Missing or invalid role" };
	}
	if (!raw.personaId || typeof raw.personaId !== "string") {
		return { error: "Missing personaId" };
	}
	if (raw.role === "SUPPORT" && !raw.ticketId) {
		return { error: "Missing ticketId for support session" };
	}

	const session: VfsSession = {
		role: raw.role,
		personaId: raw.personaId,
		ticketId: raw.role === "SUPPORT" ? String(raw.ticketId) : null,
	};

	if (!VfsSessionScope.isReady(session)) {
		return { error: "Incomplete session" };
	}

	return session;
}

export async function POST(request: Request) {
	let body: ChatBody;
	try {
		body = (await request.json()) as ChatBody;
	} catch {
		return jsonError(400, "Invalid JSON body");
	}

	const providerRaw = body.provider;
	if (!providerRaw || !isAiProvider(providerRaw)) {
		return jsonError(400, "Missing or invalid provider");
	}
	const provider: AiProvider = providerRaw;
	const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
	if (!apiKey) {
		return jsonError(400, "Missing apiKey");
	}

	const sessionOrError = parseSession(body.session);
	if ("error" in sessionOrError) {
		return jsonError(400, sessionOrError.error);
	}
	const session = sessionOrError;

	const messages = Array.isArray(body.messages) ? body.messages : [];
	if (messages.length === 0) {
		return jsonError(400, "Missing messages");
	}

	const userText = extractLatestUserText(messages);
	const guard = checkUserMessage(userText);
	if (!guard.ok) {
		return assistantTextStreamResponse(guard.userMessage);
	}

	const resolved = resolveProviderModel({ provider, apiKey });
	const requestId = generateId();
	const toolCalls: AgentTraceToolCall[] = [];
	const traceBase = {
		requestId,
		provider: resolved.provider,
		modelId: resolved.modelId,
		role: session.role,
		personaId: session.personaId,
		ticketId: session.ticketId,
	};

	captureChatStart(traceBase);

	try {
		const system = await buildSystemPrompt(session);
		const { VfsStore } = await import("@/lib/vfs/store");
		const store = VfsStore.forSession(session);
		const tools = createAgentTools(store.getController(), (event) => {
			toolCalls.push(event);
			captureToolCall({ ...traceBase, ...event });
		});

		const modelMessages = convertToModelMessages(messages, { tools });
		const model = createLanguageModel({ provider, apiKey });

		const result = streamText({
			model,
			system,
			messages: modelMessages,
			tools,
			stopWhen: stepCountIs(20),
			onError({ error }) {
				const message =
					error instanceof Error ? error.message : "streamText error";
				captureChatError({ ...traceBase, message });
			},
			onFinish({ totalUsage }) {
				captureChatEnd({
					...traceBase,
					toolCalls,
					usage: {
						inputTokens: totalUsage.inputTokens,
						outputTokens: totalUsage.outputTokens,
						totalTokens: totalUsage.totalTokens,
					},
				});
				void flushAnalytics();
			},
		});

		return result.toUIMessageStreamResponse({
			originalMessages: messages,
			onError(error) {
				const message =
					error instanceof Error ? error.message : "Chat stream failed";
				captureChatError({ ...traceBase, message });
				void flushAnalytics();
				return MODEL_REQUEST_FAILED_MESSAGE;
			},
		});
	} catch (error) {
		await logServerError("Failed to start chat", error);
		return jsonError(500, UNEXPECTED_ERROR_MESSAGE);
	}
}
