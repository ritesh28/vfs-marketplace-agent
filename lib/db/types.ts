/** Session / event actor role — shared by UI session and `events.actor`. */
export type Role = "CUSTOMER" | "SELLER" | "SUPPORT";

/** Order fulfillment status — TypeScript only; stored as text in Postgres. */
export type OrderStatus = "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED";

/** Support ticket status — TypeScript only; stored as text in Postgres. */
export type TicketStatus = "OPEN" | "IN-PROGRESS" | "RESOLVED";

/** Ticket message author — subset of Role (sellers do not send ticket messages). */
export type TicketMessageFrom = Extract<Role, "CUSTOMER" | "SUPPORT">;

/**
 * Product metadata stored on `products.metadata`.
 * Free-form key/value map used by seed / VFS product projections.
 */
export type ProductMetadata = Record<string, string | number>;

/** Actor who triggered a domain `events` row (persona session). */
export type EventActor = {
  role: Role;
  personaId: string;
  ticketId?: string | null;
};

/**
 * Structured change details for an `events` row.
 * Extends as more agent-output operations are added.
 */
export type EventPayload = {
  /** Absolute VFS path involved (agent-output or domain file). */
  path?: string;
  /** Domain resource / table label, e.g. customers. */
  resource?: string;
  /** Operation label, e.g. customer_profile_edit. */
  operation?: string;
  /** Row id touched by the change. */
  id?: string;
  /** Column updated (profile edits). */
  column_name?: string;
  /** New value for a column update. */
  updated_value?: string | number | boolean | null;
};
