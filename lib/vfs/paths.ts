import type {
  FileKind,
  VfsPath as PathString,
  VfsToolName,
} from "@/lib/vfs/types";
import {
  VFS_AGENT_OUTPUT_FILE_PATHS,
  VFS_DIRECTORY_PATHS,
  VFS_DOMAIN_FILE_PATHS,
} from "@/lib/vfs/types";

/** Cast after normalize / builders; runtime gated by path pattern arrays. */
function asPath(path: string): PathString {
  return path as PathString;
}

/** Digits-only UUID: 8-4-4-4-12 */
export const VFS_ENTITY_ID_RE =
  /^[0-9]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{12}$/;

const OUTPUT_N_RE = /^[1-9][0-9]*$/;

export const VFS_ROOT = "marketplace" as const;

const DOMAIN_FILE_KINDS = [
  "seller-profile",
  "seller-product",
  "customer-profile",
  "customer-order",
  "customer-ticket",
] as const;

/** Match `path` against a `{id}` / `{n}` pattern from the allowlist arrays. */
function matchesPattern(path: string, pattern: string): boolean {
  return extractPlaceholders(path, pattern) !== null;
}

/**
 * Walk pattern vs path; return ordered placeholder values, or null if no match.
 * `{id}` → entity id string; `{n}` → digit string (caller parses).
 */
function extractPlaceholders(
  path: string,
  pattern: string,
): string[] | null {
  const values: string[] = [];
  let pi = 0;
  let ai = 0;

  while (pi < pattern.length) {
    if (pattern.startsWith("{id}", pi)) {
      const nextLit = nextLiteral(pattern, pi + 4);
      const end =
        nextLit === ""
          ? path.length
          : path.indexOf(nextLit, ai);
      if (nextLit !== "" && end === -1) {
        return null;
      }
      const value = path.slice(ai, nextLit === "" ? undefined : end);
      if (!VFS_ENTITY_ID_RE.test(value)) {
        return null;
      }
      values.push(value);
      ai += value.length;
      pi += 4;
      continue;
    }
    if (pattern.startsWith("{n}", pi)) {
      const nextLit = nextLiteral(pattern, pi + 3);
      const end =
        nextLit === ""
          ? path.length
          : path.indexOf(nextLit, ai);
      if (nextLit !== "" && end === -1) {
        return null;
      }
      const value = path.slice(ai, nextLit === "" ? undefined : end);
      if (!OUTPUT_N_RE.test(value)) {
        return null;
      }
      values.push(value);
      ai += value.length;
      pi += 3;
      continue;
    }
    if (ai >= path.length || path[ai] !== pattern[pi]) {
      return null;
    }
    ai += 1;
    pi += 1;
  }

  return ai === path.length ? values : null;
}

function nextLiteral(pattern: string, from: number): string {
  const id = pattern.indexOf("{id}", from);
  const n = pattern.indexOf("{n}", from);
  let end = pattern.length;
  if (id !== -1) {
    end = Math.min(end, id);
  }
  if (n !== -1) {
    end = Math.min(end, n);
  }
  return pattern.slice(from, end);
}

function matchesAny(
  path: string,
  patterns: readonly string[],
): boolean {
  return patterns.some((pattern) => matchesPattern(path, pattern));
}

/** Path helpers + validation gate. Exported as `VfsPath` for API routes. */
export class VfsPath {
  static root(): PathString {
    return VFS_ROOT;
  }

  /** Strip a single leading `/`; collapse duplicate slashes; trim trailing slash. */
  static normalize(path: string): PathString {
    let next = path.trim().replace(/\\/g, "/");
    if (next.startsWith("/")) {
      next = next.slice(1);
    }
    next = next.replace(/\/+/g, "/");
    if (next.length > 1 && next.endsWith("/")) {
      next = next.slice(0, -1);
    }
    return asPath(next);
  }

  static join(parent: PathString, name: string): PathString {
    const p = VfsPath.normalize(parent);
    const n = name.replace(/^\/+|\/+$/g, "");
    if (!p) {
      return asPath(n);
    }
    return asPath(`${p}/${n}`);
  }

  static basename(path: PathString): string {
    const normalized = VfsPath.normalize(path);
    const idx = normalized.lastIndexOf("/");
    return idx === -1 ? normalized : normalized.slice(idx + 1);
  }

  static dirname(path: PathString): PathString {
    const normalized = VfsPath.normalize(path);
    const idx = normalized.lastIndexOf("/");
    if (idx <= 0) {
      return VFS_ROOT;
    }
    return asPath(normalized.slice(0, idx));
  }

  static isEntityId(value: string): boolean {
    return VFS_ENTITY_ID_RE.test(value);
  }

  static isDomainFile(path: PathString): boolean {
    return matchesAny(path, VFS_DOMAIN_FILE_PATHS);
  }

  static isAgentOutputFile(path: PathString): boolean {
    return matchesAny(path, VFS_AGENT_OUTPUT_FILE_PATHS);
  }

  static isDirectory(path: PathString): boolean {
    return matchesAny(path, VFS_DIRECTORY_PATHS);
  }

  static isFile(path: PathString): boolean {
    return VfsPath.isDomainFile(path) || VfsPath.isAgentOutputFile(path);
  }

  static assertValidToolPath(tool: VfsToolName, path: PathString): void {
    const normalized = VfsPath.normalize(path);
    if (tool === "write") {
      if (!VfsPath.isAgentOutputFile(normalized)) {
        throw new Error(
          `Invalid write path: ${path}. Must be marketplace/agent-output/output-N.json`,
        );
      }
      return;
    }
    if (tool === "list_directory" || tool === "search") {
      if (!VfsPath.isDirectory(normalized)) {
        throw new Error(`Invalid directory path for ${tool}: ${path}`);
      }
      return;
    }
    if (!VfsPath.isFile(normalized) && !VfsPath.isDirectory(normalized)) {
      throw new Error(`Invalid read path: ${path}`);
    }
  }

  static parseDomainFile(path: PathString): {
    kind: FileKind;
    sellerId?: string;
    customerId?: string;
    productId?: string;
    orderId?: string;
    ticketId?: string;
  } | null {
    const p = VfsPath.normalize(path);

    for (let i = 0; i < VFS_DOMAIN_FILE_PATHS.length; i += 1) {
      const pattern = VFS_DOMAIN_FILE_PATHS[i]!;
      const ids = extractPlaceholders(p, pattern);
      if (!ids) {
        continue;
      }
      const kind = DOMAIN_FILE_KINDS[i]!;
      switch (kind) {
        case "seller-profile":
          return { kind, sellerId: ids[0] };
        case "seller-product":
          return { kind, sellerId: ids[0], productId: ids[1] };
        case "customer-profile":
          return { kind, customerId: ids[0] };
        case "customer-order":
          return { kind, customerId: ids[0], orderId: ids[1] };
        case "customer-ticket":
          return { kind, customerId: ids[0], ticketId: ids[1] };
      }
    }

    if (VfsPath.isAgentOutputFile(p)) {
      return { kind: "agent-output" };
    }
    return null;
  }

  static sellerProfile(sellerId: string): PathString {
    return asPath(`marketplace/sellers/${sellerId}/profile.md`);
  }

  static sellerProduct(sellerId: string, productId: string): PathString {
    return asPath(
      `marketplace/sellers/${sellerId}/products/${productId}.md`,
    );
  }

  static customerProfile(customerId: string): PathString {
    return asPath(`marketplace/customers/${customerId}/profile.md`);
  }

  static customerOrder(customerId: string, orderId: string): PathString {
    return asPath(
      `marketplace/customers/${customerId}/orders/${orderId}.md`,
    );
  }

  static customerTicket(customerId: string, ticketId: string): PathString {
    return asPath(
      `marketplace/customers/${customerId}/support/${ticketId}.md`,
    );
  }

  static agentOutput(n: number): PathString {
    return asPath(`marketplace/agent-output/output-${n}.json`);
  }

  static parseAgentOutputNumber(path: PathString): number | null {
    const ids = extractPlaceholders(
      VfsPath.normalize(path),
      VFS_AGENT_OUTPUT_FILE_PATHS[0],
    );
    return ids ? Number(ids[0]) : null;
  }
}
