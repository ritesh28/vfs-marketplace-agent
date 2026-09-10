export type Role = "customer" | "seller" | "support";

export type AiProvider = "openai" | "gemini" | "anthropic";

export type SessionSelection = {
  role: Role | null;
  personaId: string | null;
  ticketId: string | null;
};

export type PersonaStub = {
  id: string;
  name: string;
  role: Role;
};

export type TicketStub = {
  id: string;
  label: string;
  customerId: string;
  orderId: string;
};
