CREATE SCHEMA IF NOT EXISTS "project_vfs_marketplace";
--> statement-breakpoint
CREATE TYPE "project_vfs_marketplace"."order_status" AS ENUM('confirmed', 'processing', 'shipped', 'delivered');--> statement-breakpoint
CREATE TYPE "project_vfs_marketplace"."ticket_message_from" AS ENUM('customer', 'support');--> statement-breakpoint
CREATE TYPE "project_vfs_marketplace"."ticket_status" AS ENUM('open', 'in-progress', 'resolved');--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"actor" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"date" text NOT NULL,
	"total_cost" numeric(12, 2) NOT NULL,
	"status" "project_vfs_marketplace"."order_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."support_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"from" "project_vfs_marketplace"."ticket_message_from" NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_vfs_marketplace"."tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "project_vfs_marketplace"."ticket_status" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "project_vfs_marketplace"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."order_items" ADD CONSTRAINT "order_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "project_vfs_marketplace"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "project_vfs_marketplace"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."products" ADD CONSTRAINT "products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "project_vfs_marketplace"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "project_vfs_marketplace"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."tickets" ADD CONSTRAINT "tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "project_vfs_marketplace"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "project_vfs_marketplace"."orders"("id") ON DELETE no action ON UPDATE no action;