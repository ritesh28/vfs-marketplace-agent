/** Session / event actor role — shared by UI session and `events.actor`. */
export type Role = "CUSTOMER" | "SELLER" | "SUPPORT";

/** Runtime list of all Role values — import instead of redefining. */
export const ROLES: readonly Role[] = ["CUSTOMER", "SELLER", "SUPPORT"];

export function isRole(value: string): value is Role {
	return (ROLES as readonly string[]).includes(value);
}

/** Order fulfillment status — TypeScript only; stored as text in Postgres. */
export type OrderStatus = "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED";

/** Support ticket status — TypeScript only; stored as text in Postgres. */
export type TicketStatus = "OPEN" | "IN-PROGRESS" | "RESOLVED";

/** Static copy for VFS markdown `## status definition` blocks. */
export const STATUS_DEFINITIONS = {
	order: {
		CONFIRMED:
			"Order placed and accepted; payment recorded; awaiting fulfillment.",
		PROCESSING: "Warehouse or seller is preparing the items for shipment.",
		SHIPPED: "Package has left the seller; in transit to the customer.",
		DELIVERED: "Package marked as delivered to the customer.",
	},
	ticket: {
		OPEN: "Ticket filed; waiting for support to pick it up.",
		"IN-PROGRESS": "Support is actively investigating or working on the issue.",
		RESOLVED: "Issue addressed; no further action expected unless reopened.",
	},
} as const satisfies {
	order: Record<OrderStatus, string>;
	ticket: Record<TicketStatus, string>;
};

export function orderStatusDefinitionLines(): string[] {
	return (Object.keys(STATUS_DEFINITIONS.order) as OrderStatus[]).map(
		(status) => `- ${status}: ${STATUS_DEFINITIONS.order[status]}`,
	);
}

export function ticketStatusDefinitionLines(): string[] {
	return (Object.keys(STATUS_DEFINITIONS.ticket) as TicketStatus[]).map(
		(status) => `- ${status}: ${STATUS_DEFINITIONS.ticket[status]}`,
	);
}

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
