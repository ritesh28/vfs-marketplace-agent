ALTER TABLE "project_vfs_marketplace"."order_items" DROP CONSTRAINT IF EXISTS "order_items_item_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."order_items" ADD COLUMN "item_name" text;
--> statement-breakpoint
UPDATE "project_vfs_marketplace"."order_items" AS "oi"
SET "item_name" = "p"."name"
FROM "project_vfs_marketplace"."products" AS "p"
WHERE "oi"."item_id" = "p"."id";
--> statement-breakpoint
UPDATE "project_vfs_marketplace"."order_items" SET "item_name" = '' WHERE "item_name" IS NULL;
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."order_items" ALTER COLUMN "item_name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "project_vfs_marketplace"."order_items" DROP COLUMN "item_id";
