import type {
  DomainFileKind,
  VfsFilePermissions,
  VfsMarkdownFrontmatter,
  VfsSession,
} from "@/lib/vfs/types";
import type { ProductMetadata } from "@/lib/db/types";
import {
  orderStatusDefinitionLines,
  ticketStatusDefinitionLines,
} from "@/lib/db/types";
import { formatSydneyDateTime, toIsoCreatedAt } from "@/lib/vfs/time";

// TODO: per-persona / per-FileKind permission matrix (when write on domain files is allowed).
export function permissionsForFile(
  _ctx: VfsSession,
  _kind: DomainFileKind,
): VfsFilePermissions {
  return { read: true, write: false };
}

export function toMarkdown(
  frontmatter: VfsMarkdownFrontmatter,
  body: string,
): string {
  const perms = frontmatter.permissions;
  const yaml = [
    "---",
    `path: "${frontmatter.path}"`,
    `resource-type: "${frontmatter["resource-type"]}"`,
    `created_at: ${frontmatter.created_at}`,
    "permissions:",
    `  read: ${perms.read}`,
    `  write: ${perms.write}`,
    "---",
    "",
    body.trimEnd(),
    "",
  ].join("\n");
  return yaml;
}

export function buildFrontmatter(
  session: VfsSession,
  path: VfsMarkdownFrontmatter["path"],
  kind: DomainFileKind,
  createdAt: Date,
): VfsMarkdownFrontmatter {
  return {
    path,
    "resource-type": kind,
    created_at: toIsoCreatedAt(createdAt),
    permissions: permissionsForFile(session, kind),
  };
}

export function sellerProfileBody(row: {
  id: string;
  name: string;
  emailId: string;
}): string {
  return [
    "# profile",
    `- seller-id: ${row.id}`,
    `- name: ${row.name}`,
    `- email: ${row.emailId}`,
  ].join("\n");
}

export function customerProfileBody(row: {
  id: string;
  name: string;
  emailId: string;
}): string {
  return [
    "# profile",
    `- customer-id: ${row.id}`,
    `- name: ${row.name}`,
    `- email: ${row.emailId}`,
  ].join("\n");
}

export function sellerProductBody(row: {
  id: string;
  sellerId: string;
  name: string;
  category: string;
  quantity: number;
  metadata: ProductMetadata;
}): string {
  const metaLines = Object.entries(row.metadata ?? {}).map(
    ([key, value]) => `- ${key}: ${value}`,
  );
  return [
    "# Product Information",
    `- product-id: ${row.id}`,
    `- seller-id: ${row.sellerId}`,
    `- name: ${row.name}`,
    `- category: ${row.category}`,
    `- quantity: ${row.quantity}`,
    "",
    "## metadata",
    ...(metaLines.length > 0 ? metaLines : ["- (none)"]),
  ].join("\n");
}

export function customerOrderBody(row: {
  id: string;
  customerId: string;
  date: string;
  totalCost: string;
  status: string;
  items: Array<{ itemName: string; price: string; quantity: number }>;
}): string {
  const itemLines = row.items.flatMap((item) => [
    `- name: ${item.itemName}`,
    `  price: ${item.price}`,
    `  quantity: ${item.quantity}`,
  ]);
  return [
    "# Order information",
    `- order-id: ${row.id}`,
    `- customer-id: ${row.customerId}`,
    `- order-date: ${row.date}`,
    `- total-cost: ${row.totalCost}`,
    `- status: ${row.status}`,
    "",
    "## status definition",
    ...orderStatusDefinitionLines(),
    "",
    "## order items",
    ...(itemLines.length > 0 ? itemLines : ["- (none)"]),
  ].join("\n");
}

export function customerTicketBody(row: {
  id: string;
  customerId: string;
  orderId: string;
  status: string;
  messages: Array<{ from: string; body: string; createdAt: Date }>;
}): string {
  const messageLines = row.messages.map(
    (m) =>
      `- [${m.from}]: [${formatSydneyDateTime(m.createdAt)}] ${m.body}`,
  );
  return [
    "# ticket information",
    `- ticket-id: ${row.id}`,
    `- customer-id: ${row.customerId}`,
    `- order-id: ${row.orderId}`,
    `- status: ${row.status}`,
    "",
    "## status definition",
    ...ticketStatusDefinitionLines(),
    "",
    "## messages",
    ...(messageLines.length > 0 ? messageLines : ["- (none)"]),
  ].join("\n");
}
