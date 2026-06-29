import { useCallback, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";

const TableStateSchema = z.object({
	page: z.number().int().positive().default(1),
	pageSize: z.number().int().positive().default(20),
	sortBy: z.string().optional(),
	sortDir: z.enum(["asc", "desc"]).optional(),
	query: z.string().default(""),
	filters: z.record(z.string(), z.unknown()).default({}),
});

export type TableState = z.infer<typeof TableStateSchema>;

interface UseDataTableUrlSyncOptions {
	whitelist?: string[];
	defaultPageSize?: number;
}

interface UseDataTableUrlSyncReturn {
	tableState: TableState;
	updateTableState: (updates: Partial<TableState>) => void;
}

interface SearchParams {
	page?: string;
	pageSize?: string;
	sortBy?: string;
	sortDir?: string;
	query?: string;
	filters?: Record<string, unknown>;
}

export function useDataTableUrlSync(
	options: UseDataTableUrlSyncOptions = {},
): UseDataTableUrlSyncReturn {
	const { whitelist = [], defaultPageSize = 20 } = options;

	const searchParams = useSearch({ strict: false }) as SearchParams;
	const navigate = useNavigate();

	const tableState = useMemo<TableState>(() => {
		const rawState = {
			page: Number(searchParams.page) || 1,
			pageSize: Number(searchParams.pageSize) || defaultPageSize,
			sortBy: searchParams.sortBy || undefined,
			sortDir: searchParams.sortDir || undefined,
			query: searchParams.query || "",
			filters: searchParams.filters || {},
		};

		const parsed = TableStateSchema.safeParse(rawState);
		return parsed.success ? parsed.data : TableStateSchema.parse({});
	}, [searchParams, defaultPageSize]);

	const updateTableState = useCallback(
		(updates: Partial<TableState>) => {
			const newState = { ...tableState, ...updates };

			const urlParams: Record<string, unknown> = {};

			if (newState.page !== 1) {
				urlParams.page = newState.page;
			}
			if (newState.pageSize !== defaultPageSize) {
				urlParams.pageSize = newState.pageSize;
			}
			if (newState.sortBy) {
				urlParams.sortBy = newState.sortBy;
			}
			if (newState.sortDir) {
				urlParams.sortDir = newState.sortDir;
			}
			if (newState.query) {
				urlParams.query = newState.query;
			}

			const allowedFilters =
				whitelist.length > 0
					? Object.fromEntries(
							Object.entries(newState.filters).filter(([key]) =>
								whitelist.includes(key),
							),
						)
					: newState.filters;

			if (Object.keys(allowedFilters).length > 0) {
				urlParams.filters = allowedFilters;
			}

			navigate({
				to: ".",
				search: (prev: any) => {
					const newSearch = { ...prev, ...urlParams };
					if (newState.page === 1) delete newSearch.page;
					if (newState.pageSize === defaultPageSize) delete newSearch.pageSize;
					if (!newState.sortBy) delete newSearch.sortBy;
					if (!newState.sortDir) delete newSearch.sortDir;
					if (!newState.query) delete newSearch.query;
					if (Object.keys(allowedFilters).length === 0) delete newSearch.filters;
					return newSearch;
				},
				replace: true,
			});
		},
		[tableState, navigate, whitelist, defaultPageSize],
	);

	return {
		tableState,
		updateTableState,
	};
}
