import { isRole, ROLES, type Role, type TicketStatus } from "@/lib/db/types";

export type { Role, TicketStatus };
export { isRole, ROLES };

export type AiProvider = "openai" | "gemini" | "anthropic";

/** Fixed model ids per provider (single source for UI + server). */
export const PROVIDER_MODELS = {
	openai: "gpt-5.6-luna",
	gemini: "gemini-2.5-pro",
	anthropic: "claude-opus-4-20250514",
} as const satisfies Record<AiProvider, string>;

export type ProviderModelId = (typeof PROVIDER_MODELS)[AiProvider];

const PROVIDER_DISPLAY_NAMES: Record<AiProvider, string> = {
	openai: "OpenAI",
	gemini: "Gemini",
	anthropic: "Anthropic",
};

/** UI label: e.g. `OpenAI · gpt-5.6-luna`. */
export function providerModelLabel(provider: AiProvider): string {
	return `${PROVIDER_DISPLAY_NAMES[provider]} · ${PROVIDER_MODELS[provider]}`;
}

export type SessionSelection = {
	role: Role | null;
	personaId: string | null;
	ticketId: string | null;
};

/** Persona list item from GET /api/personas?role= */
export type Persona = {
	id: string;
	name: string;
};

/** Ticket list item from GET /api/tickets */
export type TicketSummary = {
	id: string;
	label: string;
	customerId: string;
	orderId: string;
	status: TicketStatus;
};
