"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

export function ChatPanel() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [draft, setDraft] = useState("");

	function handleSend() {
		const content = draft.trim();
		if (!content) {
			return;
		}

		setMessages((current) => [
			...current,
			{
				id: crypto.randomUUID(),
				role: "user",
				content,
			},
			{
				id: crypto.randomUUID(),
				role: "assistant",
				content:
					"Chat is UI-only in Phase 1. The agent backend lands in a later phase.",
			},
		]);
		setDraft("");
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<ScrollArea className="min-h-0 flex-1 px-4 py-3">
				<div className="flex flex-col gap-3">
					{messages.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Ask anything about the marketplace. The agent will use VFS tools
							once they are wired.
						</p>
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
								{message.content}
							</div>
						))
					)}
				</div>
			</ScrollArea>
			<div className="flex shrink-0 gap-2 border-t p-3">
				<Textarea
					className="min-h-[72px] resize-none"
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							handleSend();
						}
					}}
					placeholder="Message the agent…"
					value={draft}
				/>
				<Button className="self-end" onClick={handleSend} type="button">
					Send
				</Button>
			</div>
		</div>
	);
}
