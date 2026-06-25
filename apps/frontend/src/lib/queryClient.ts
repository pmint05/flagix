import { QueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";

import { ApiError } from "@/lib/errors";

function getErrorMessage(error: unknown): string {
	if (error instanceof ApiError) return error.message;
	if (error instanceof Error) return error.message;
	return "Something went wrong. Please try again.";
}

function isAuthError(error: unknown): boolean {
	return error instanceof ApiError && error.code === "auth";
}

function handleError(error: unknown) {
	if (isAuthError(error)) {
		toast.danger("Session expired", {
			description: "Please sign in again.",
		});
		return;
	}
	toast.danger(getErrorMessage(error));
}

export function createQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				retry: (failureCount, error) => {
					if (isAuthError(error)) return false;
					return failureCount < 2;
				},
			},
			mutations: {
				retry: false,
			},
		},
	});

	// Global error callbacks are wired via QueryCache/MutationCache `notify`
	// in TanStack Query v5. Individual query hooks use `throwOnError` or
	// handle errors inline. The `api.ts` layer already normalizes all HTTP
	// errors to `ApiError`, so feature code just catches `ApiError`.
	//
	// To show global toasts for unhandled query errors, each route-level
	// query hook should call `handleError` in its `onError` callback, or
	// use the `useApiQuery` wrapper from `src/hooks/useApiQuery.ts`.
}

/** Expose for use in feature-level error handlers. */
export { handleError as onQueryError };
