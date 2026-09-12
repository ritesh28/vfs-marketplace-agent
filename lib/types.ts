import type { Role, TicketStatus } from "@/lib/db/types";

export type { Role, TicketStatus };

export type AiProvider = "openai" | "gemini" | "anthropic";

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
