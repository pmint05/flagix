export type ApiErrorCode =
	| "auth"
	| "forbidden"
	| "not_found"
	| "conflict"
	| "validation"
	| "rate_limit"
	| "server"
	| "network"
	| "timeout"
	| "unknown";

export interface FieldError {
	field: string;
	message: string;
}

export interface ApiErrorOptions {
	code: ApiErrorCode;
	message: string;
	status?: number;
	fieldErrors?: FieldError[];
	cause?: unknown;
}

const FRIENDLY_MESSAGES: Record<ApiErrorCode, string> = {
	auth: "Your session has expired. Please sign in again.",
	forbidden: "You don't have permission to perform this action.",
	not_found: "We couldn't find what you were looking for.",
	conflict:
		"This was changed by someone else. Please reload the latest version and try again.",
	validation:
		"Some of the information provided was invalid. Please review the form and try again.",
	rate_limit:
		"You've made too many requests. Please wait a moment and try again.",
	server: "Something went wrong on our end. Please try again in a moment.",
	network:
		"Couldn't connect to the server. Check your internet connection and try again.",
	timeout: "The request took too long. Please try again.",
	unknown: "Something went wrong. Please try again.",
};

export class ApiError extends Error {
	readonly code: ApiErrorCode;
	readonly status?: number;
	readonly fieldErrors?: FieldError[];
	readonly cause?: unknown;

	constructor(options: ApiErrorOptions) {
		super(options.message, { cause: options.cause });
		this.name = "ApiError";
		this.code = options.code;
		this.status = options.status;
		this.fieldErrors = options.fieldErrors;
		this.cause = options.cause;

		Object.setPrototypeOf(this, ApiError.prototype);
	}

	/** True when the failure is transient and a retry might succeed. */
	get isTransient(): boolean {
		return (
			this.code === "network" ||
			this.code === "timeout" ||
			this.code === "rate_limit" ||
			this.code === "server"
		);
	}

	/** True when the request was rejected for a permission/session reason. */
	get isAuthRelated(): boolean {
		return this.code === "auth" || this.code === "forbidden";
	}
}

/** Map an HTTP status code (and optional parsed body) to an `ApiError`.*/
export function fromHttpError(
	status: number,
	body: unknown,
	cause?: unknown,
): ApiError {
	const envelope = normalizeBody(body);
	const fieldErrors = extractFieldErrors(envelope);
	const code = statusToCode(status);
	const fallback = FRIENDLY_MESSAGES[code];

	const backendMessage =
		typeof envelope.message === "string" && envelope.message.trim().length > 0
			? envelope.message
			: undefined;
	const message = backendMessage || fallback;
	console.log(message)

	return new ApiError({
		code,
		message,
		status,
		fieldErrors,
		cause,
	});
}

/** Convert a low-level fetch/network failure (no response) to an `ApiError`. */
export function fromNetworkError(error: unknown): ApiError {
	if (error instanceof DOMException && error.name === "AbortError") {
		return new ApiError({
			code: "timeout",
			message: FRIENDLY_MESSAGES.timeout,
			cause: error,
		});
	}
	if (error instanceof TypeError) {
		// fetch throws TypeError on network failures (DNS, offline, CORS).
		return new ApiError({
			code: "network",
			message: FRIENDLY_MESSAGES.network,
			cause: error,
		});
	}
	if (error instanceof ApiError) return error;
	return new ApiError({
		code: "unknown",
		message: FRIENDLY_MESSAGES.unknown,
		cause: error,
	});
}

function statusToCode(status: number): ApiErrorCode {
	if (status === 401 || status === 419) return "auth";
	if (status === 403) return "forbidden";
	if (status === 404) return "not_found";
	if (status === 409) return "conflict";
	if (status === 422) return "validation";
	if (status === 429) return "rate_limit";
	if (status >= 500) return "server";
	return "unknown";
}

interface ErrorEnvelope {
	message?: unknown;
	errors?: unknown;
}

function normalizeBody(body: unknown): ErrorEnvelope {
	if (!body || typeof body !== "object") return {};
	return body as ErrorEnvelope;
}

function extractFieldErrors(envelope: ErrorEnvelope): FieldError[] | undefined {
	if (!Array.isArray(envelope.errors)) return undefined;

	const result: FieldError[] = [];
	
	for (const entry of envelope.errors) {
		if (!entry || typeof entry !== "object") continue;
		
		const { field, message } = entry as Record<string, unknown>;
		
		if (typeof field === "string" && typeof message === "string") {
			result.push({ field, message });
		}
	}
	
	return result.length > 0 ? result : undefined;
}
