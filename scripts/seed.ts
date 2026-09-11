import path from "node:path";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  customers,
  events,
  orderItems,
  orders,
  products,
  sellers,
  supportUsers,
  ticketMessages,
  tickets,
} from "../lib/db/schema";
import {
  seedCustomers,
  seedOrderItems,
  seedOrders,
  seedProducts,
  seedSellers,
  seedSupportUsers,
  seedTicketMessages,
  seedTickets,
} from "../lib/seed/data";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

async function seed() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, {
    prepare: false,
    max: 1,
    ssl: "require",
  });
  const db = drizzle(client);

  try {
    await db.delete(ticketMessages);
    await db.delete(tickets);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(products);
    await db.delete(events);
    await db.delete(sellers);
    await db.delete(customers);
    await db.delete(supportUsers);

    await db.insert(sellers).values([...seedSellers]);
    await db.insert(customers).values([...seedCustomers]);
    await db.insert(supportUsers).values([...seedSupportUsers]);
    await db.insert(products).values([...seedProducts]);
    await db.insert(orders).values([...seedOrders]);
    await db.insert(orderItems).values([...seedOrderItems]);
    await db.insert(tickets).values([...seedTickets]);
    await db.insert(ticketMessages).values([...seedTicketMessages]);

    console.log("Seed complete:");
    console.log(`  sellers: ${seedSellers.length}`);
    console.log(`  customers: ${seedCustomers.length}`);
    console.log(`  support_users: ${seedSupportUsers.length}`);
    console.log(`  products: ${seedProducts.length}`);
    console.log(`  orders: ${seedOrders.length}`);
    console.log(`  order_items: ${seedOrderItems.length}`);
    console.log(`  tickets: ${seedTickets.length}`);
    console.log(`  ticket_messages: ${seedTicketMessages.length}`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
