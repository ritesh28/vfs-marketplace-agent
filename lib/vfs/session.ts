import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { orderItems, orders, products, tickets } from "@/lib/db/schema";
import { VfsPath } from "@/lib/vfs/paths";
import type { VfsSession } from "@/lib/vfs/types";

export type VfsPersonaScope = {
  sellerIds: Set<string>;
  customerIds: Set<string>;
};

export class VfsSessionScope {
  static isReady(session: VfsSession): boolean {
    if (!session.role || !session.personaId) {
      return false;
    }
    if (session.role === "SUPPORT" && !session.ticketId) {
      return false;
    }
    return true;
  }

  static sessionKey(session: VfsSession): string {
    return `${session.role}:${session.personaId}:${session.ticketId ?? ""}`;
  }

  /** Resolve which seller/customer subtrees are visible for this session. */
  static async resolvePersonaScope(
    session: VfsSession,
  ): Promise<VfsPersonaScope> {
    if (session.role === "SELLER") {
      return {
        sellerIds: new Set([session.personaId]),
        customerIds: new Set(),
      };
    }

    if (session.role === "CUSTOMER") {
      return {
        sellerIds: new Set(),
        customerIds: new Set([session.personaId]),
      };
    }

    // SUPPORT + ticket
    const ticketId = session.ticketId!;
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return { sellerIds: new Set(), customerIds: new Set() };
    }

    const items = await db
      .select({ itemName: orderItems.itemName })
      .from(orderItems)
      .where(eq(orderItems.orderId, ticket.orderId));

    const names = [...new Set(items.map((i) => i.itemName))];
    const sellerIds = new Set<string>();
    if (names.length > 0) {
      const matched = await db
        .select({ sellerId: products.sellerId })
        .from(products)
        .where(inArray(products.name, names));
      for (const row of matched) {
        sellerIds.add(row.sellerId);
      }
    }

    // Ensure order row exists for scoping (unused beyond customer).
    await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, ticket.orderId))
      .limit(1);

    return {
      sellerIds,
      customerIds: new Set([ticket.customerId]),
    };
  }

  static isPathVisible(path: string, personaScope: VfsPersonaScope): boolean {
    const p = VfsPath.normalize(path);

    if (p === "marketplace" || p === "marketplace/agent-output") {
      return true;
    }
    if (p.startsWith("marketplace/agent-output/")) {
      return true;
    }

    if (p === "marketplace/sellers" || p.startsWith("marketplace/sellers/")) {
      if (personaScope.sellerIds.size === 0) {
        return false;
      }
      if (p === "marketplace/sellers") {
        return true;
      }
      const rest = p.slice("marketplace/sellers/".length);
      const sellerId = rest.split("/")[0]!;
      return personaScope.sellerIds.has(sellerId);
    }

    if (
      p === "marketplace/customers" ||
      p.startsWith("marketplace/customers/")
    ) {
      if (personaScope.customerIds.size === 0) {
        return false;
      }
      if (p === "marketplace/customers") {
        return true;
      }
      const rest = p.slice("marketplace/customers/".length);
      const customerId = rest.split("/")[0]!;
      return personaScope.customerIds.has(customerId);
    }

    return false;
  }
}
