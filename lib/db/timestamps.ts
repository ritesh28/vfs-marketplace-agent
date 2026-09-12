import { timestamp } from "drizzle-orm/pg-core";

/** Timestamp with time zone (timestamptz). */
export function timestamptz(name: string) {
	return timestamp(name, { withTimezone: true });
}

export function createdAt() {
	return timestamptz("created_at").notNull().defaultNow();
}

export function updatedAt() {
	return timestamptz("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date());
}

/** Fresh builders per call — do not reuse one column instance across tables. */
export function timestamps() {
	return {
		createdAt: createdAt(),
		updatedAt: updatedAt(),
	};
}
