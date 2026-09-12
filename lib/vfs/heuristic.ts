import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { customers, events } from "@/lib/db/schema";
import type { VfsDbAdapter } from "@/lib/vfs/adapter";
import { VfsPath } from "@/lib/vfs/paths";
import type { CustomerProfileEditPayload, VfsSession } from "@/lib/vfs/types";
import {
	agentOutputJsonSchema,
	customerProfileEditSchema,
} from "@/lib/vfs/write-schemas";

export class VfsHeuristicProcessor {
	constructor(private readonly adapter: VfsDbAdapter) {}

	async processAgentOutput(
		session: VfsSession,
		rawJson: string,
	): Promise<void> {
		const parsed = agentOutputJsonSchema.parse(rawJson);

		const profileEdit = customerProfileEditSchema.safeParse(parsed);
		if (profileEdit.success) {
			await this.applyCustomerProfileEdit(session, profileEdit.data);
			return;
		}

		// TODO: other operations (order create, ticket message, product update, …)
		throw new Error(
			"Unsupported agent-output payload. Only customer profile edit is implemented.",
		);
	}

	async applyCustomerProfileEdit(
		session: VfsSession,
		payload: CustomerProfileEditPayload,
	): Promise<void> {
		if (session.role !== "CUSTOMER") {
			throw new Error("Only CUSTOMER persona may edit a customer profile");
		}
		if (session.personaId !== payload["customer-id"]) {
			throw new Error("Cannot edit another customer's profile");
		}

		const column = payload["column-name"];
		const value = payload["updated-value"];

		if (column === "email_id" && !isValidEmail(value)) {
			throw new Error(`Invalid email: ${value}`);
		}

		const patch = column === "name" ? { name: value } : { emailId: value };

		await db
			.update(customers)
			.set(patch)
			.where(eq(customers.id, payload["customer-id"]));

		const profilePath = VfsPath.customerProfile(payload["customer-id"]);

		await db.insert(events).values({
			type: "customer_profile_edit",
			payload: {
				path: profilePath,
				resource: "customers",
				operation: "customer_profile_edit",
				id: payload["customer-id"],
				column_name: column,
				updated_value: value,
			},
			actor: {
				role: session.role,
				personaId: session.personaId,
				ticketId: session.ticketId,
			},
		});

		await this.adapter.refreshMarkdown(profilePath);
	}
}

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
