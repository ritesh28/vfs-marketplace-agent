import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

function createDb() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error("DATABASE_URL is not set");
	}

	const client = postgres(connectionString, {
		prepare: false,
		max: 10,
		ssl: "require",
	});

	return drizzle(client, { schema });
}

const globalForDb = globalThis as typeof globalThis & {
	__vfsMarketplaceDb?: ReturnType<typeof createDb>;
};

export const db = globalForDb.__vfsMarketplaceDb ?? createDb();

if (process.env.NODE_ENV !== "production") {
	globalForDb.__vfsMarketplaceDb = db;
}
