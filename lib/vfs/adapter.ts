import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
	customers,
	orderItems,
	orders,
	products,
	sellers,
	ticketMessages,
	tickets,
} from "@/lib/db/schema";
import {
	indexDirectoryPath,
	indexFilePath,
	listFromIndex,
} from "@/lib/vfs/directory-index";
import {
	buildFrontmatter,
	customerOrderBody,
	customerProfileBody,
	customerTicketBody,
	sellerProductBody,
	sellerProfileBody,
	toMarkdown,
} from "@/lib/vfs/markdown";
import { VfsPath } from "@/lib/vfs/paths";
import { type VfsPersonaScope, VfsSessionScope } from "@/lib/vfs/session";
import type {
	DomainFileKind,
	VfsDirectoryIndex,
	VfsFileMap,
	VfsHydrateContext,
	VfsListEntry,
	VfsPath as VfsPathString,
	VfsSession,
} from "@/lib/vfs/types";

export class VfsDbAdapter {
	constructor(
		private readonly fsMap: VfsFileMap, // flat map of all files by path
		private readonly directoryIndex: VfsDirectoryIndex, // index of all directories by path (lookup)
		private readonly session: VfsSession,
		private personaScope: VfsPersonaScope | null = null,
	) {}

	async ensurePersonaScope(): Promise<VfsPersonaScope> {
		if (!this.personaScope) {
			this.personaScope = await VfsSessionScope.resolvePersonaScope(
				this.session,
			);
		}
		return this.personaScope;
	}

	async hydrate(ctx: VfsHydrateContext): Promise<void> {
		await this.ensurePersonaScope();
		indexDirectoryPath(this.directoryIndex, VfsPath.root());
		indexDirectoryPath(this.directoryIndex, "marketplace/agent-output");

		for (const path of ctx.targetPaths) {
			const normalized = VfsPath.normalize(path);
			if (VfsPath.isDirectory(normalized)) {
				await this.ensureDirectoryListed(normalized);
			} else if (VfsPath.isFile(normalized)) {
				await this.ensureFileHydrated(normalized);
			}
		}
	}

	async ensureDirectoryListed(
		directoryPath: VfsPathString,
	): Promise<VfsListEntry[]> {
		const path = VfsPath.normalize(directoryPath);
		VfsPath.assertValidToolPath("list_directory", path);

		const personaScope = await this.ensurePersonaScope();
		if (!VfsSessionScope.isPathVisible(path, personaScope)) {
			throw new Error(`Directory not visible in this session: ${path}`);
		}

		await this.discoverDirectory(path, personaScope);
		return listFromIndex(this.directoryIndex, path).filter((entry) =>
			VfsSessionScope.isPathVisible(entry.path, personaScope),
		);
	}

	async ensureFileHydrated(filePath: VfsPathString): Promise<string | null> {
		const path = VfsPath.normalize(filePath);
		const personaScope = await this.ensurePersonaScope();

		if (VfsPath.isAgentOutputFile(path)) {
			if (!VfsSessionScope.isPathVisible(path, personaScope)) {
				return null;
			}
			return this.fsMap.get(path) ?? null;
		}

		if (!VfsPath.isDomainFile(path)) {
			return null;
		}
		if (!VfsSessionScope.isPathVisible(path, personaScope)) {
			return null;
		}

		const existing = this.fsMap.get(path);
		if (existing !== undefined) {
			return existing;
		}

		const parsed = VfsPath.parseDomainFile(path);
		if (!parsed || parsed.kind === "agent-output") {
			return null;
		}

		const content = await this.loadDomainMarkdown(parsed.kind, parsed);
		if (content === null) {
			return null;
		}

		this.putFile(path, content);
		return content;
	}

	async refreshMarkdown(filePath: VfsPathString): Promise<void> {
		const path = VfsPath.normalize(filePath);
		this.fsMap.delete(path);
		await this.ensureFileHydrated(path);
	}

	putFile(path: VfsPathString, content: string): void {
		const normalized = VfsPath.normalize(path);
		this.fsMap.set(normalized, content);
		indexFilePath(this.directoryIndex, normalized);
	}

	private async discoverDirectory(
		path: VfsPathString,
		personaScope: VfsPersonaScope,
	): Promise<void> {
		indexDirectoryPath(this.directoryIndex, path);

		if (path === "marketplace") {
			if (personaScope.sellerIds.size > 0) {
				indexDirectoryPath(this.directoryIndex, "marketplace/sellers");
			}
			if (personaScope.customerIds.size > 0) {
				indexDirectoryPath(this.directoryIndex, "marketplace/customers");
			}
			indexDirectoryPath(this.directoryIndex, "marketplace/agent-output");
			return;
		}

		if (path === "marketplace/sellers") {
			for (const sellerId of personaScope.sellerIds) {
				indexDirectoryPath(
					this.directoryIndex,
					`marketplace/sellers/${sellerId}`,
				);
			}
			return;
		}

		if (path === "marketplace/customers") {
			for (const customerId of personaScope.customerIds) {
				indexDirectoryPath(
					this.directoryIndex,
					`marketplace/customers/${customerId}`,
				);
			}
			return;
		}

		if (path === "marketplace/agent-output") {
			// Files appear when written; directory already indexed.
			return;
		}

		const sellerMatch = path.match(
			/^marketplace\/sellers\/([0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12})$/,
		);
		if (sellerMatch) {
			const sellerId = sellerMatch[1];
			if (!sellerId) {
				return;
			}
			await this.ensureFileHydrated(VfsPath.sellerProfile(sellerId));
			indexDirectoryPath(
				this.directoryIndex,
				`marketplace/sellers/${sellerId}/products`,
			);
			return;
		}

		const sellerProducts = path.match(
			/^marketplace\/sellers\/([0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12})\/products$/,
		);
		if (sellerProducts) {
			const sellerId = sellerProducts[1];
			if (!sellerId) {
				return;
			}
			const rows = await db
				.select({ id: products.id })
				.from(products)
				.where(eq(products.sellerId, sellerId))
				.orderBy(asc(products.name));
			for (const row of rows) {
				await this.ensureFileHydrated(VfsPath.sellerProduct(sellerId, row.id));
			}
			return;
		}

		const customerMatch = path.match(
			/^marketplace\/customers\/([0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12})$/,
		);
		if (customerMatch) {
			const customerId = customerMatch[1];
			if (!customerId) {
				return;
			}
			await this.ensureFileHydrated(VfsPath.customerProfile(customerId));
			indexDirectoryPath(
				this.directoryIndex,
				`marketplace/customers/${customerId}/orders`,
			);
			indexDirectoryPath(
				this.directoryIndex,
				`marketplace/customers/${customerId}/support`,
			);
			return;
		}

		const customerOrders = path.match(
			/^marketplace\/customers\/([0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12})\/orders$/,
		);
		if (customerOrders) {
			const customerId = customerOrders[1];
			if (!customerId) {
				return;
			}
			const rows = await db
				.select({ id: orders.id })
				.from(orders)
				.where(eq(orders.customerId, customerId))
				.orderBy(asc(orders.date));
			for (const row of rows) {
				await this.ensureFileHydrated(
					VfsPath.customerOrder(customerId, row.id),
				);
			}
			return;
		}

		const customerSupport = path.match(
			/^marketplace\/customers\/([0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12})\/support$/,
		);
		if (customerSupport) {
			const customerId = customerSupport[1];
			if (!customerId) {
				return;
			}
			const rows = await db
				.select({ id: tickets.id })
				.from(tickets)
				.where(eq(tickets.customerId, customerId))
				.orderBy(asc(tickets.id));
			for (const row of rows) {
				await this.ensureFileHydrated(
					VfsPath.customerTicket(customerId, row.id),
				);
			}
		}
	}

	private async loadDomainMarkdown(
		kind: DomainFileKind,
		ids: {
			sellerId?: string;
			customerId?: string;
			productId?: string;
			orderId?: string;
			ticketId?: string;
		},
	): Promise<string | null> {
		if (kind === "seller-profile" && ids.sellerId) {
			const [row] = await db
				.select()
				.from(sellers)
				.where(eq(sellers.id, ids.sellerId))
				.limit(1);
			if (!row) return null;
			const path = VfsPath.sellerProfile(row.id);
			return toMarkdown(
				buildFrontmatter(this.session, path, kind, row.createdAt),
				sellerProfileBody(row),
			);
		}

		if (kind === "seller-product" && ids.sellerId && ids.productId) {
			const [row] = await db
				.select()
				.from(products)
				.where(
					and(
						eq(products.id, ids.productId),
						eq(products.sellerId, ids.sellerId),
					),
				)
				.limit(1);
			if (!row) return null;
			const path = VfsPath.sellerProduct(row.sellerId, row.id);
			return toMarkdown(
				buildFrontmatter(this.session, path, kind, row.createdAt),
				sellerProductBody(row),
			);
		}

		if (kind === "customer-profile" && ids.customerId) {
			const [row] = await db
				.select()
				.from(customers)
				.where(eq(customers.id, ids.customerId))
				.limit(1);
			if (!row) return null;
			const path = VfsPath.customerProfile(row.id);
			return toMarkdown(
				buildFrontmatter(this.session, path, kind, row.createdAt),
				customerProfileBody(row),
			);
		}

		if (kind === "customer-order" && ids.customerId && ids.orderId) {
			const [row] = await db
				.select()
				.from(orders)
				.where(
					and(
						eq(orders.id, ids.orderId),
						eq(orders.customerId, ids.customerId),
					),
				)
				.limit(1);
			if (!row) return null;
			const items = await db
				.select()
				.from(orderItems)
				.where(eq(orderItems.orderId, row.id))
				.orderBy(asc(orderItems.id));
			const path = VfsPath.customerOrder(row.customerId, row.id);
			return toMarkdown(
				buildFrontmatter(this.session, path, kind, row.createdAt),
				customerOrderBody({
					...row,
					items: items.map((i) => ({
						itemName: i.itemName,
						price: i.price,
						quantity: i.quantity,
					})),
				}),
			);
		}

		if (kind === "customer-ticket" && ids.customerId && ids.ticketId) {
			const [row] = await db
				.select()
				.from(tickets)
				.where(
					and(
						eq(tickets.id, ids.ticketId),
						eq(tickets.customerId, ids.customerId),
					),
				)
				.limit(1);
			if (!row) return null;
			const messages = await db
				.select()
				.from(ticketMessages)
				.where(eq(ticketMessages.ticketId, row.id))
				.orderBy(asc(ticketMessages.createdAt), asc(ticketMessages.id));
			const path = VfsPath.customerTicket(row.customerId, row.id);
			return toMarkdown(
				buildFrontmatter(this.session, path, kind, row.createdAt),
				customerTicketBody({
					...row,
					messages: messages.map((m) => ({
						from: m.from,
						body: m.body,
						createdAt: m.createdAt,
					})),
				}),
			);
		}

		return null;
	}
}

/** Initial target paths for a session. */
export async function initialTargetPaths(
	session: VfsSession,
): Promise<VfsPathString[]> {
	const personaScope = await VfsSessionScope.resolvePersonaScope(session);
	const paths: VfsPathString[] = [VfsPath.root(), "marketplace/agent-output"];

	if (personaScope.sellerIds.size > 0) {
		paths.push("marketplace/sellers");
		for (const id of personaScope.sellerIds) {
			paths.push(`marketplace/sellers/${id}`);
		}
	}
	if (personaScope.customerIds.size > 0) {
		paths.push("marketplace/customers");
		for (const id of personaScope.customerIds) {
			paths.push(`marketplace/customers/${id}`);
		}
	}

	if (session.role === "SUPPORT" && session.ticketId) {
		const [ticket] = await db
			.select()
			.from(tickets)
			.where(eq(tickets.id, session.ticketId))
			.limit(1);
		if (ticket) {
			paths.push(
				VfsPath.customerTicket(ticket.customerId, ticket.id),
				VfsPath.customerOrder(ticket.customerId, ticket.orderId),
			);
		}
	}

	return paths;
}
