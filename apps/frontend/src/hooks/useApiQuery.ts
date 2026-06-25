import {
	useQuery,
	type UseQueryOptions,
	type UseQueryResult,
} from "@tanstack/react-query";
import type { ApiError } from "@/lib/errors";

export function useApiQuery<TData, TError = ApiError>(
	options: UseQueryOptions<TData, TError>,
): UseQueryResult<TData, TError> {
	return useQuery<TData, TError>(options);
}
