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

type Database = ReturnType<typeof createDb>;

const globalForDb = globalThis as typeof globalThis & {
	__vfsMarketplaceDb?: Database;
};

/** First query creates the pool, so a missing `DATABASE_URL` throws inside the route handler. */
function getDb(): Database {
	if (!globalForDb.__vfsMarketplaceDb) {
		globalForDb.__vfsMarketplaceDb = createDb();
	}
	return globalForDb.__vfsMarketplaceDb;
}

export const db: Database = new Proxy({} as Database, {
	get(_target, prop) {
		const real = getDb();
		const value = Reflect.get(real, prop, real);
		return typeof value === "function" ? value.bind(real) : value;
	},
});
