ALTER TABLE "project_vfs_marketplace"."order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."order_items" DROP CONSTRAINT "order_items_item_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."orders" DROP CONSTRAINT "orders_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."products" DROP CONSTRAINT "products_seller_id_sellers_id_fk";
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."ticket_messages" DROP CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk";
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."tickets" DROP CONSTRAINT "tickets_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."tickets" DROP CONSTRAINT "tickets_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."orders" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."ticket_messages" ALTER COLUMN "from" SET DATA TYPE text USING "from"::text;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."tickets" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "project_vfs_marketplace"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."order_items" ADD CONSTRAINT "order_items_item_id_products_id_fk" FOREIGN KEY ("item_id") REFERENCES "project_vfs_marketplace"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "project_vfs_marketplace"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."products" ADD CONSTRAINT "products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "project_vfs_marketplace"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "project_vfs_marketplace"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."tickets" ADD CONSTRAINT "tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "project_vfs_marketplace"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."tickets" ADD CONSTRAINT "tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "project_vfs_marketplace"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP TYPE "project_vfs_marketplace"."order_status";--> statement-breakpoint
DROP TYPE "project_vfs_marketplace"."ticket_message_from";--> statement-breakpoint
DROP TYPE "project_vfs_marketplace"."ticket_status";
