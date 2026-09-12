import type { Role } from "@/lib/db/types";

/**
 * Entity id segment in VFS paths (digits-only UUID at runtime).
 * Template parameter is structural; enforce with VFS_ENTITY_ID_RE.
 */
export type VfsEntityId = string;

/** Expand `{id}` → entity id and `{n}` → number in path pattern strings. */
type ExpandPlaceholders<S extends string> = S extends `${infer A}{id}${infer B}`
	? `${A}${VfsEntityId}${ExpandPlaceholders<B>}`
	: S extends `${infer A}{n}${infer B}`
		? `${A}${number}${ExpandPlaceholders<B>}`
		: S;

/**
 * Allowed VFS path patterns (no leading slash).
 * `{id}` = digits UUID; `{n}` = 1, 2, 3, …
 * Single source of truth for types + runtime matching.
 */
export const VFS_DIRECTORY_PATHS = [
	"marketplace",
	"marketplace/sellers",
	"marketplace/sellers/{id}",
	"marketplace/sellers/{id}/products",
	"marketplace/customers",
	"marketplace/customers/{id}",
	"marketplace/customers/{id}/orders",
	"marketplace/customers/{id}/support",
	"marketplace/agent-output",
] as const;

export const VFS_DOMAIN_FILE_PATHS = [
	"marketplace/sellers/{id}/profile.md",
	"marketplace/sellers/{id}/products/{id}.md",
	"marketplace/customers/{id}/profile.md",
	"marketplace/customers/{id}/orders/{id}.md",
	"marketplace/customers/{id}/support/{id}.md",
] as const;

export const VFS_AGENT_OUTPUT_FILE_PATHS = [
	"marketplace/agent-output/output-{n}.json",
] as const;

export type VfsDirectoryPath = ExpandPlaceholders<
	(typeof VFS_DIRECTORY_PATHS)[number]
>;
export type VfsDomainFilePath = ExpandPlaceholders<
	(typeof VFS_DOMAIN_FILE_PATHS)[number]
>;
export type VfsAgentOutputPath = ExpandPlaceholders<
	(typeof VFS_AGENT_OUTPUT_FILE_PATHS)[number]
>;

/** Allowed file or directory path in the marketplace VFS. */
export type VfsPath = VfsDirectoryPath | VfsDomainFilePath | VfsAgentOutputPath;
export type VfsFileMap = Map<VfsPath, string>;

/**
 * Parallel index for list_directory / UI tree only.
 * Key = parent directory path; value = child tokens using **basename** + kind
 * (`file:profile.md`, `directory:orders`), not full VfsPath.
 *
 * Why basename tokens (not `file:${VfsPath}`):
 * - fsMap already gives O(1) content lookup by full path; this map answers
 *   “what are the immediate children of this directory?”
 * - Matches list/UI needs (name + file|directory); full child path = join(parent, name).
 * - Avoids duplicating long absolute paths in every Set entry (memory / hydrate churn).
 * - Uniqueness is (parentDir, token) — same basename under different parents is fine.
 */
export type VfsDirEntryToken = `file:${string}` | `directory:${string}`;
export type VfsDirectoryIndex = Map<VfsPath, Set<VfsDirEntryToken>>;

export type FileKind =
	| "seller-profile"
	| "seller-product"
	| "customer-profile"
	| "customer-order"
	| "customer-ticket"
	| "agent-output";

export type DomainFileKind = Exclude<FileKind, "agent-output">;

export type VfsSession = {
	role: Role;
	personaId: string;
	ticketId: string | null;
};

export type VfsHydrateContext = VfsSession & {
	targetPaths: VfsPath[];
};

export type VfsListEntry = {
	name: string;
	kind: "file" | "directory";
	path: VfsPath;
};

export type VfsSearchQuery = {
	query: string;
	directoryPath: VfsPath;
};

export type VfsSearchHit = {
	path: VfsPath;
	match: string;
};

export type VfsFilePermissions = {
	read: boolean;
	write: boolean;
};

export type VfsMarkdownFrontmatter = {
	path: VfsPath;
	"resource-type": DomainFileKind;
	created_at: string;
	permissions: VfsFilePermissions;
};

/** Agent JSON payload — kebab-case keys. DB columns stay snake_case (e.g. email_id). */
export type CustomerProfileEditPayload = {
	"customer-id": string;
	"column-name": "name" | "email_id";
	"updated-value": string;
};

/** Result of a successful `write` tool call (returned to the LLM). */
export type VfsWriteResult = {
	success: true;
};

export type VfsToolName = "list_directory" | "read" | "write" | "search";
