import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import {
	customers,
	type DbTableName,
	dbTableNames,
	sellers,
	supportUsers,
	tableMap,
	ticketMessages,
	tickets,
} from "@/lib/db/schema";
import type { Persona, Role, TicketSummary } from "@/lib/types";

export function listTableNames(): DbTableName[] {
	return [...dbTableNames];
}

export function isDbTableName(value: string): value is DbTableName {
	return dbTableNames.includes(value as DbTableName);
}

export async function getTableRows(table: DbTableName) {
	const tableRef = tableMap[table];
	return db.select().from(tableRef);
}

export async function listPersonasByRole(role: Role): Promise<Persona[]> {
	if (role === "CUSTOMER") {
		const rows = await db
			.select({ id: customers.id, name: customers.name })
			.from(customers)
			.orderBy(asc(customers.name));
		return rows;
	}

	if (role === "SELLER") {
		const rows = await db
			.select({ id: sellers.id, name: sellers.name })
			.from(sellers)
			.orderBy(asc(sellers.name));
		return rows;
	}

	const rows = await db
		.select({ id: supportUsers.id, name: supportUsers.name })
		.from(supportUsers)
		.orderBy(asc(supportUsers.name));
	return rows;
}

export async function listTicketSummaries(): Promise<TicketSummary[]> {
	const rows = await db
		.select({
			id: tickets.id,
			customerId: tickets.customerId,
			orderId: tickets.orderId,
			status: tickets.status,
		})
		.from(tickets)
		.orderBy(asc(tickets.id));

	const messages = await db
		.select({
			ticketId: ticketMessages.ticketId,
			body: ticketMessages.body,
			id: ticketMessages.id,
		})
		.from(ticketMessages)
		.orderBy(asc(ticketMessages.id));

	const firstBodyByTicket = new Map<string, string>();
	for (const message of messages) {
		if (!firstBodyByTicket.has(message.ticketId)) {
			firstBodyByTicket.set(message.ticketId, message.body);
		}
	}

	return rows.map((row) => {
		const body = firstBodyByTicket.get(row.id);
		return {
			id: row.id,
			customerId: row.customerId,
			orderId: row.orderId,
			status: row.status,
			label: body
				? truncateLabel(body)
				: `${row.status} — order ${row.orderId.slice(0, 8)}`,
		};
	});
}

function truncateLabel(body: string, max = 48): string {
	if (body.length <= max) {
		return body;
	}

	return `${body.slice(0, max - 1)}…`;
}
