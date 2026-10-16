import {
	UNEXPECTED_ERROR_MESSAGE,
	UNREACHABLE_MESSAGE,
} from "@/lib/error-messages";

export class RequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RequestError";
	}
}

export async function readJson<T>(response: Response): Promise<T> {
	let data: unknown;
	try {
		data = await response.json();
	} catch {
		throw new RequestError(UNEXPECTED_ERROR_MESSAGE);
	}

	if (!response.ok) {
		const message =
			data &&
			typeof data === "object" &&
			"error" in data &&
			typeof data.error === "string" &&
			data.error
				? data.error
				: UNEXPECTED_ERROR_MESSAGE;
		throw new RequestError(message);
	}

	return data as T;
}

export function requestErrorMessage(error: unknown): string {
	return error instanceof RequestError ? error.message : UNREACHABLE_MESSAGE;
}
