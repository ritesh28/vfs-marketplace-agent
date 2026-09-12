import { VfsPath } from "@/lib/vfs/paths";
import type { VfsPath as PathString, VfsToolName } from "@/lib/vfs/types";

export type UserGuardrailResult =
	| { ok: true }
	| {
			ok: false;
			code: "policy_violation" | "invalid_email";
			userMessage: string;
	  };

export type PathGuardrailResult =
	| { ok: true; path: PathString }
	| { ok: false; toolError: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const POLICY_PATTERNS: RegExp[] = [
	/\b(fuck|shit|bitch|asshole|cunt|slut|whore)\b/i,
	/\b(kill\s+yourself|kys)\b/i,
	/\b(porn|xxx|nude|naked|sex\s*tape|hentai)\b/i,
	/\b(nigg(?:er|a)|faggot|retard)\b/i,
	/\bsucker@[^\s]+\b/i,
];

const EMAIL_CHANGE_HINT =
	/\b(email|e-mail|email_id|email-id)\b.{0,80}\b(change|update|set|to|as)\b|\b(change|update|set)\b.{0,80}\b(email|e-mail|email_id|email-id)\b/i;

function extractEmails(text: string): string[] {
	const matches = text.match(/[^\s<>"']+@[^\s<>"']+/g);
	return matches ?? [];
}

/**
 * User-message guardrails: policy content + email format when changing email.
 * On failure, the assistant should ask the user to review (no tools / no write).
 */
export function checkUserMessage(text: string): UserGuardrailResult {
	const trimmed = text.trim();
	if (!trimmed) {
		return { ok: true };
	}

	for (const pattern of POLICY_PATTERNS) {
		if (pattern.test(trimmed)) {
			return {
				ok: false,
				code: "policy_violation",
				userMessage:
					"This request looks against our content policy (offensive, abusive, sexual, or non-decent). Please review and rephrase your request.",
			};
		}
	}

	if (EMAIL_CHANGE_HINT.test(trimmed)) {
		const emails = extractEmails(trimmed);
		if (emails.length === 0) {
			return {
				ok: false,
				code: "invalid_email",
				userMessage:
					"You asked to change an email, but no valid email address was provided. Please review and include a correctly formatted email.",
			};
		}
		const invalid = emails.find((email) => !EMAIL_RE.test(email));
		if (invalid) {
			return {
				ok: false,
				code: "invalid_email",
				userMessage: `The email "${invalid}" is not valid. Please review and provide a correctly formatted email address.`,
			};
		}
	}

	return { ok: true };
}

/** Tool-path guardrail against VFS allowlists. */
export function checkToolPath(
	tool: VfsToolName,
	path: string,
): PathGuardrailResult {
	const normalized = VfsPath.normalize(path);
	try {
		VfsPath.assertValidToolPath(tool, normalized);
		return { ok: true, path: normalized };
	} catch {
		return {
			ok: false,
			toolError: `Invalid path for ${tool}: "${path}". Provide a valid path from the allowlist (see system instructions: allowed directories for list_directory/search; file or directory for read; marketplace/agent-output/output-N.json for write).`,
		};
	}
}
