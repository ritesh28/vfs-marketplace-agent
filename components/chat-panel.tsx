"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
	PROVIDER_SETTINGS_CHANGED_EVENT,
	requestDbRefresh,
} from "@/lib/client-events";
import { loadProviderSettings } from "@/lib/provider-storage";
import { useSessionStore } from "@/lib/session-store";
import type { AiProvider } from "@/lib/types";
import { isSessionReady } from "@/lib/vfs/session-gate";
import type { VfsSession } from "@/lib/vfs/types";

function messageText(message: {
	parts: Array<{ type: string; text?: string }>;
}): string {
	return message.parts
		.filter((part) => part.type === "text" && typeof part.text === "string")
		.map((part) => part.text ?? "")
		.join("");
}

export function ChatPanel() {
	const selection = useSessionStore();
	const [draft, setDraft] = useState("");
	const [provider, setProvider] = useState<AiProvider>("openai");
	const [apiKey, setApiKey] = useState("");
	const [settingsReady, setSettingsReady] = useState(false);

	useEffect(() => {
		function syncSettings() {
			const settings = loadProviderSettings();
			setProvider(settings.provider);
			setApiKey(settings.apiKey);
			setSettingsReady(true);
		}
		syncSettings();
		window.addEventListener(PROVIDER_SETTINGS_CHANGED_EVENT, syncSettings);
		return () => {
			window.removeEventListener(PROVIDER_SETTINGS_CHANGED_EVENT, syncSettings);
		};
	}, []);

	const sessionSelection = {
		role: selection.role,
		personaId: selection.personaId,
		ticketId: selection.ticketId,
	};
	const session: VfsSession | null = isSessionReady(sessionSelection)
		? {
				role: sessionSelection.role,
				personaId: sessionSelection.personaId,
				ticketId:
					sessionSelection.role === "SUPPORT"
						? sessionSelection.ticketId
						: null,
			}
		: null;

	const requestContextRef = useRef({
		provider,
		apiKey,
		session,
	});
	requestContextRef.current = { provider, apiKey, session };

	const transport = useMemo(
		() =>
			new DefaultChatTransport({
				api: "/api/chat",
				body: () => {
					const ctx = requestContextRef.current;
					return {
						provider: ctx.provider,
						apiKey: ctx.apiKey,
						session: ctx.session,
					};
				},
			}),
		[],
	);

	const { messages, sendMessage, status, error, clearError } = useChat({
		transport,
		onFinish: () => {
			requestDbRefresh();
		},
	});

	const canSend =
		settingsReady &&
		session !== null &&
		apiKey.trim().length > 0 &&
		draft.trim().length > 0;

	const busy = status === "submitted" || status === "streaming";

	async function handleSend() {
		const text = draft.trim();
		if (!canSend || busy || !session || !text) {
			return;
		}
		clearError();
		setDraft("");
		await sendMessage({ text });
	}

	let emptyHint =
		"Ask anything about the marketplace. The agent uses VFS tools for the active session.";
	if (!session) {
		emptyHint =
			"Select a role and persona to start chatting. Support also needs a ticket.";
	} else if (!apiKey.trim()) {
		emptyHint = "Enter an API key for the selected provider to enable chat.";
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<ScrollArea className="min-h-0 flex-1 px-4 py-3">
				<div className="flex flex-col gap-3">
					{messages.length === 0 ? (
						<p className="text-muted-foreground text-sm">{emptyHint}</p>
					) : (
						messages.map((message) => (
							<div
								className={
									message.role === "user"
										? "ml-8 rounded-lg bg-primary px-3 py-2 text-primary-foreground text-sm"
										: "mr-8 rounded-lg bg-muted px-3 py-2 text-sm"
								}
								key={message.id}
							>
								{messageText(message) || (
									<span className="text-muted-foreground italic">
										{message.role === "assistant" && busy
											? "Thinking…"
											: "(no text)"}
									</span>
								)}
							</div>
						))
					)}
					{error ? (
						<div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-sm">
							{error.message}
						</div>
					) : null}
				</div>
			</ScrollArea>
			<div className="flex shrink-0 gap-2 border-t p-3">
				<Textarea
					className="min-h-[72px] resize-none"
					disabled={!session || !apiKey.trim() || busy}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							void handleSend();
						}
					}}
					placeholder={
						!session
							? "Complete session selection first…"
							: !apiKey.trim()
								? "Add an API key to chat…"
								: "Message the agent…"
					}
					value={draft}
				/>
				<Button
					className="self-end"
					disabled={!canSend || busy}
					onClick={() => void handleSend()}
					type="button"
				>
					{busy ? "Sending…" : "Send"}
				</Button>
			</div>
		</div>
	);
}
