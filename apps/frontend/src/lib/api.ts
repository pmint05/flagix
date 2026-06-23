import ky, { type KyInstance, type BeforeRetryHook, type Options } from "ky";
import { ZodError, type ZodType } from "zod";

import { ApiError, fromHttpError, fromNetworkError } from "./errors";

const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRY = 2;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export const API_BASE_URL =
	(import.meta.env.VITE_API_BASE_URL as string | undefined) ??
	"http://localhost:9000/api";

let tokenAccessor: () => string | null | undefined = () => undefined;

export function setAuthTokenAccessor(
	accessor: () => string | null | undefined,
) {
	tokenAccessor = accessor;
}

let onUnauthorized: () => void = () => {
	if (typeof window !== "undefined" && window.location.pathname !== "/login") {
		window.location.assign("/login?reason=expired");
	}
};

export function setUnauthorizedHandler(handler: () => void) {
	onUnauthorized = handler;
}

async function toApiError(error: unknown): Promise<ApiError> {
	if (error && typeof error === "object" && "response" in error) {
		const response = (error as { response: Response }).response;
		let body: unknown = null;
		try {
			body = await response.json();
		} catch {
			body = null;
		}
		const apiError = fromHttpError(response.status, body, error);
		if (apiError.code === "auth") onUnauthorized();
		return apiError;
	}
	return fromNetworkError(error);
}

/** Before-request hook: attach the bearer token if present. */
const attachToken = (state: { request: Request }) => {
	const token = tokenAccessor();
	if (token) {
		state.request.headers.set("Authorization", `Bearer ${token}`);
	}
	return state.request;
};

/** Before-retry hook: refresh the token before each retry attempt. */
const refreshTokenOnRetry: BeforeRetryHook = ({ request }) => {
	const token = tokenAccessor();
	if (token) request.headers.set("Authorization", `Bearer ${token}`);
	return request;
};

/** Before-error hook: normalize the final error to `ApiError`. */
const normalizeError = async ({ error }: { error: unknown }) => {
	throw await toApiError(error);
};

const base = ky.create({
	baseUrl: API_BASE_URL,
	timeout: DEFAULT_TIMEOUT,
	retry: {
		limit: MAX_RETRY,
		// Only retry idempotent methods. POST/PATCH/PUT/DELETE never auto-retry to avoid duplicate writes.
		methods: ["GET"],
		statusCodes: [...RETRYABLE_STATUS],
		backoffLimit: 1000,
	},
	hooks: {
		beforeRequest: [attachToken],
		beforeRetry: [refreshTokenOnRetry],
		beforeError: [normalizeError],
	},
});

/**
 * Typed request helpers. Each method returns `Promise<T>` where `T` is
 * inferred from the optional `schema` (a Zod schema whose output type is
 * `T`). When no schema is passed, `T` defaults to `unknown` and the raw
 * JSON value is returned without validation.
 *
 * @example
 *   const projects = await api.get('projects', { schema: projectsListSchema });
 *   // projects is typed as z.infer<typeof projectsListSchema>
 */
export interface ApiRequestOptions<T = unknown> extends Options {
	/**
	 * Optional Zod schema used to parse the response body. When provided, the
	 * response is validated and a failed parse throws `ApiError` with
	 * `code: 'validation'` so the UI treats it like any other bad response.
	 */
	schema?: ZodType<T>;
}

function withSchema<T>(schema: ZodType<T> | undefined, value: unknown): T {
	if (!schema) return value as T;
	try {
		return schema.parse(value);
	} catch (error) {
		if (error instanceof ZodError) {
			throw new ApiError({
				code: "validation",
				message:
					"The server returned data in an unexpected format. Please refresh and try again.",
				fieldErrors: error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				})),
				cause: error,
			});
		}
		throw fromNetworkError(error);
	}
}

export const api = {
	async get<T = unknown>(
		url: string,
		options: ApiRequestOptions<T> = {},
	): Promise<T> {
		return base
			.get(url, options)
			.json()
			.then((v) => withSchema<T>(options.schema, v));
	},
	async post<T = unknown>(
		url: string,
		options: ApiRequestOptions<T> = {},
	): Promise<T> {
		return base
			.post(url, options)
			.json()
			.then((v) => withSchema<T>(options.schema, v));
	},
	async put<T = unknown>(
		url: string,
		options: ApiRequestOptions<T> = {},
	): Promise<T> {
		return base
			.put(url, options)
			.json()
			.then((v) => withSchema<T>(options.schema, v));
	},
	async patch<T = unknown>(
		url: string,
		options: ApiRequestOptions<T> = {},
	): Promise<T> {
		const v = await base.patch(url, options).json();
		return withSchema<T>(options.schema, v);
	},
	async delete<T = unknown>(
		url: string,
		options: ApiRequestOptions<T> = {},
	): Promise<T> {
		return base
			.delete(url, options)
			.json()
			.then((v) => withSchema<T>(options.schema, v));
	},
};

/**
 * Raw ky instance — exposed for feature modules that need streaming, custom
 * response types (blob/arrayBuffer), or non-JSON endpoints. Use sparingly;
 * prefer `api.get/post/...` so error formatting stays consistent.
 */
export const rawClient: KyInstance = base;

export { ApiError } from "./errors";
export type { ApiErrorCode, ApiErrorOptions, FieldError } from "./errors";
