import { APICallError, RetryError } from "ai";

/** Who failed. The code stays the same across database, provider, and app checks. */
export type ErrorSource = "database" | "provider" | "app";

/**
 * Shared failure kinds.
 * Connection loss, timeouts, and rate limits are all `unavailable`.
 * Bad credentials and missing config are both `unauthorized`.
 */
export type ErrorCode =
	| "invalid"
	| "unauthorized"
	| "forbidden"
	| "not_found"
	| "conflict"
	| "unavailable"
	| "aborted"
	| "internal";

export interface ErrorJSON {
	code: ErrorCode;
	source: ErrorSource;
	message: string;
	retryable: boolean;
}

interface ErrorSpec {
	status: number;
	retryable: boolean;
	message: string;
	bySource?: Partial<Record<ErrorSource, string>>;
}

const SPECS: Record<ErrorCode, ErrorSpec> = {
	invalid: {
		status: 400,
		retryable: false,
		message: "The request is invalid.",
		bySource: { provider: "This model rejected the request." },
	},
	unauthorized: {
		status: 401,
		retryable: false,
		message: "Not authorized.",
		bySource: {
			database: "Database is not configured.",
			provider: "That API key was rejected. Check the key for this provider.",
		},
	},
	forbidden: {
		status: 403,
		retryable: false,
		message: "You cannot access that.",
	},
	not_found: {
		status: 404,
		retryable: false,
		message: "Not found.",
	},
	conflict: {
		status: 409,
		retryable: false,
		message: "That conflicts with existing data.",
	},
	unavailable: {
		status: 503,
		retryable: true,
		message: "A service is unavailable. Try again.",
		bySource: {
			database: "Database is unavailable. Try again in a moment.",
			provider: "The provider is unavailable. Try again.",
		},
	},
	aborted: {
		status: 499,
		retryable: false,
		message: "Stopped.",
	},
	internal: {
		status: 500,
		retryable: true,
		message: "Something went wrong. Try again.",
	},
};

const UNAVAILABLE_DRIVER_CODES = new Set([
	"ECONNREFUSED",
	"ECONNRESET",
	"ENOTFOUND",
	"EAI_AGAIN",
	"ETIMEDOUT",
	"EPIPE",
	"EHOSTUNREACH",
	"ENETUNREACH",
	"CONNECT_TIMEOUT",
	"CONNECTION_TIMEOUT",
	"CONNECTION_CLOSED",
	"CONNECTION_ENDED",
	"CONNECTION_DESTROYED",
]);

export interface AppErrorOptions {
	source?: ErrorSource;
	message?: string;
	cause?: unknown;
}

/** Thrown on purpose, or returned by {@link toAppError} for driver and provider failures. */
export class AppError extends Error {
	readonly code: ErrorCode;
	readonly source: ErrorSource;
	readonly status: number;
	readonly retryable: boolean;

	constructor(code: ErrorCode, options: AppErrorOptions = {}) {
		const source = options.source ?? "app";
		const spec = SPECS[code];
		super(options.message ?? spec.bySource?.[source] ?? spec.message, {
			cause: options.cause,
		});
		this.name = "AppError";
		this.code = code;
		this.source = source;
		this.status = spec.status;
		this.retryable = spec.retryable;
	}

	/** Safe fields for an API body or a tool result. */
	toJSON(): ErrorJSON {
		return {
			code: this.code,
			source: this.source,
			message: this.message,
			retryable: this.retryable,
		};
	}
}

/** Map a thrown value to an {@link AppError}. Already-typed errors pass through. */
export function toAppError(error: unknown): AppError {
	if (error instanceof AppError) {
		return error;
	}

	for (const candidate of walk(error)) {
		const mapped = mapError(candidate);
		if (mapped) {
			return mapped;
		}
	}

	return new AppError("internal", { cause: error });
}

/** Status and JSON body for a route `NextResponse`. */
export function errorResponse(error: unknown): {
	status: number;
	body: { error: ErrorJSON };
} {
	const appError = toAppError(error);
	return { status: appError.status, body: { error: appError.toJSON() } };
}

function mapError(error: unknown): AppError | null {
	if (error instanceof AppError) {
		return error;
	}

	if (RetryError.isInstance(error)) {
		if (error.reason === "abort") {
			return new AppError("aborted", { source: "provider", cause: error });
		}
		return null;
	}

	if (APICallError.isInstance(error)) {
		return new AppError(codeForStatus(error.statusCode, error.isRetryable), {
			source: "provider",
			cause: error,
		});
	}

	if (isAbort(error)) {
		return new AppError("aborted", { cause: error });
	}

	if (isPostgresError(error)) {
		return new AppError(codeForSqlState(error.code), {
			source: "database",
			cause: error,
		});
	}

	if (error instanceof Error && error.message === "DATABASE_URL is not set") {
		return new AppError("unauthorized", { source: "database", cause: error });
	}

	const driverCode = readCode(error);
	if (driverCode && UNAVAILABLE_DRIVER_CODES.has(driverCode)) {
		return new AppError("unavailable", { source: "database", cause: error });
	}

	return null;
}

/** HTTP status and the AI SDK retry flag collapse to the same codes. */
function codeForStatus(
	status: number | undefined,
	retryable: boolean,
): ErrorCode {
	if (status === 401 || status === 403) {
		return "unauthorized";
	}
	if (status === 404) {
		return "not_found";
	}
	if (status === 409) {
		return "conflict";
	}
	if (
		status === 408 ||
		status === 429 ||
		(status !== undefined && status >= 500)
	) {
		return "unavailable";
	}
	if (status !== undefined && status >= 400) {
		return "invalid";
	}
	return retryable ? "unavailable" : "internal";
}

/** SQLSTATE class, not each code: 08/40/53/57 connection, 28 auth, 23 constraint. */
function codeForSqlState(sqlState: string): ErrorCode {
	const sqlClass = sqlState.slice(0, 2);
	if (
		sqlClass === "08" ||
		sqlClass === "40" ||
		sqlClass === "53" ||
		sqlClass === "57"
	) {
		return "unavailable";
	}
	if (sqlClass === "28" || sqlState === "3D000") {
		return "unauthorized";
	}
	if (sqlState === "23502" || sqlState === "23514") {
		return "invalid";
	}
	if (sqlClass === "23") {
		return "conflict";
	}
	return "internal";
}

function isPostgresError(error: unknown): error is Error & { code: string } {
	return (
		error instanceof Error &&
		error.name === "PostgresError" &&
		"code" in error &&
		typeof error.code === "string"
	);
}

function isAbort(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		error.name === "AbortError"
	);
}

function readCode(error: unknown): string | null {
	if (!(error instanceof Error) || !("code" in error)) {
		return null;
	}
	return typeof error.code === "string" ? error.code : null;
}

/** Drizzle puts Postgres on `cause`. The AI SDK puts the real failure on `RetryError.lastError`. */
function walk(root: unknown): unknown[] {
	const chain: unknown[] = [];
	const seen = new Set<unknown>();
	let current: unknown = root;

	for (let depth = 0; depth < 8; depth += 1) {
		if (typeof current !== "object" || current === null || seen.has(current)) {
			break;
		}
		seen.add(current);
		chain.push(current);

		const cause = "cause" in current ? current.cause : undefined;
		if (RetryError.isInstance(current) && !seen.has(current.lastError)) {
			current = current.lastError ?? cause;
			continue;
		}
		current = cause;
	}

	return chain;
}
