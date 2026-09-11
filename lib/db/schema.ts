import {
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const DATABASE_SCHEMA =
  process.env.DATABASE_SCHEMA?.trim() || "project_vfs_marketplace";

/** Postgres schema used for all marketplace tables in this repo. */
export const marketplaceSchema = pgSchema(DATABASE_SCHEMA);

export const orderStatusEnum = marketplaceSchema.enum("order_status", [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
]);

export const ticketStatusEnum = marketplaceSchema.enum("ticket_status", [
  "open",
  "in-progress",
  "resolved",
]);

export const ticketMessageFromEnum = marketplaceSchema.enum(
  "ticket_message_from",
  ["customer", "support"],
);

export const sellers = marketplaceSchema.table("sellers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  emailId: text("email_id").notNull(),
});

export const customers = marketplaceSchema.table("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  emailId: text("email_id").notNull(),
});

export const supportUsers = marketplaceSchema.table("support_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
});

export const products = marketplaceSchema.table("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => sellers.id),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull(),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
});

export const orders = marketplaceSchema.table("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  date: text("date").notNull(),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull(),
});

export const orderItems = marketplaceSchema.table("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => products.id),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
});

export const tickets = marketplaceSchema.table("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  status: ticketStatusEnum("status").notNull(),
});

export const ticketMessages = marketplaceSchema.table("ticket_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id),
  from: ticketMessageFromEnum("from").notNull(),
  body: text("body").notNull(),
});

export const events = marketplaceSchema.table("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  actor: jsonb("actor").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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
