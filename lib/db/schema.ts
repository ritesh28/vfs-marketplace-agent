import {
	integer,
	jsonb,
	numeric,
	pgSchema,
	text,
	uuid,
} from "drizzle-orm/pg-core";

import { createdAt, timestamps } from "@/lib/db/timestamps";
import type {
	EventActor,
	EventPayload,
	OrderStatus,
	ProductMetadata,
	TicketMessageFrom,
	TicketStatus,
} from "@/lib/db/types";

export const DATABASE_SCHEMA =
	process.env.DATABASE_SCHEMA?.trim() || "project_vfs_marketplace";

/** Postgres schema used for all marketplace tables in this repo. */
export const marketplaceSchema = pgSchema(DATABASE_SCHEMA);

export const sellers = marketplaceSchema.table("sellers", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	emailId: text("email_id").notNull(),
	...timestamps(),
});

export const customers = marketplaceSchema.table("customers", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	emailId: text("email_id").notNull(),
	...timestamps(),
});

export const supportUsers = marketplaceSchema.table("support_users", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	...timestamps(),
});

export const products = marketplaceSchema.table("products", {
	id: uuid("id").defaultRandom().primaryKey(),
	sellerId: uuid("seller_id")
		.notNull()
		.references(() => sellers.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	category: text("category").notNull(),
	quantity: integer("quantity").notNull(),
	metadata: jsonb("metadata").$type<ProductMetadata>().notNull().default({}),
	...timestamps(),
});

export const orders = marketplaceSchema.table("orders", {
	id: uuid("id").defaultRandom().primaryKey(),
	customerId: uuid("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "cascade" }),
	date: text("date").notNull(),
	totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull(),
	status: text("status").$type<OrderStatus>().notNull(),
	...timestamps(),
});

export const orderItems = marketplaceSchema.table("order_items", {
	id: uuid("id").defaultRandom().primaryKey(),
	orderId: uuid("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	/** Snapshot of the product name at order time — not a FK to products. */
	itemName: text("item_name").notNull(),
	price: numeric("price", { precision: 12, scale: 2 }).notNull(),
	quantity: integer("quantity").notNull(),
	...timestamps(),
});

export const tickets = marketplaceSchema.table("tickets", {
	id: uuid("id").defaultRandom().primaryKey(),
	customerId: uuid("customer_id")
		.notNull()
		.references(() => customers.id, { onDelete: "cascade" }),
	orderId: uuid("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	status: text("status").$type<TicketStatus>().notNull(),
	...timestamps(),
});

export const ticketMessages = marketplaceSchema.table("ticket_messages", {
	id: uuid("id").defaultRandom().primaryKey(),
	ticketId: uuid("ticket_id")
		.notNull()
		.references(() => tickets.id, { onDelete: "cascade" }),
	from: text("from").$type<TicketMessageFrom>().notNull(),
	body: text("body").notNull(),
	...timestamps(),
});

export const events = marketplaceSchema.table("events", {
	id: uuid("id").defaultRandom().primaryKey(),
	type: text("type").notNull(),
	payload: jsonb("payload").$type<EventPayload>().notNull(),
	actor: jsonb("actor").$type<EventActor>().notNull(),
	createdAt: createdAt(),
});

export const tableMap = {
	sellers,
	customers,
	support_users: supportUsers,
	products,
	orders,
	order_items: orderItems,
	tickets,
	ticket_messages: ticketMessages,
	events,
} as const;

export type DbTableName = keyof typeof tableMap;

export const dbTableNames = Object.keys(tableMap) as DbTableName[];
