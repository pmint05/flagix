import { createFileRoute } from "@tanstack/react-router";
import {
	Skeleton,
	Table,
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@heroui/react";
import { useState } from "react";
import { useAuditLogs } from "@/features/audit/api";
import { AuditFilter, type AuditFilters } from "@/features/audit/AuditFilter";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";
import type { AuditLog } from "@/types/audit-log";

export const Route = createFileRoute("/_authenticated/audit-logs")({
	component: AuditLogsIndex,
});

function AuditLogsIndex() {
	const [page, setPage] = useState(1);
	const pageSize = 15;
	const [filters, setFilters] = useState<AuditFilters>({});

	const queryParams = {
		limit: pageSize,
		offset: (page - 1) * pageSize,
		entityType: filters.entityType,
		actionType: filters.actionType,
		from: filters.dateRange?.start?.toString(),
		to: filters.dateRange?.end?.toString(),
	};

	const { data, isLoading, isError } = useAuditLogs(queryParams);

	const logs = data?.data ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
				<p className="mt-1 text-sm text-default-500">
					View a chronological log of all changes across your organization.
				</p>
			</div>

			<AuditFilter
				filters={filters}
				onChange={(newFilters) => {
					setFilters(newFilters);
					setPage(1); // Reset to first page on filter change
				}}
			/>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full rounded-lg" />
					))}
				</div>
			) : isError ? (
				<div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-danger">
					Failed to load audit logs. Please try again.
				</div>
			) : logs.length === 0 ? (
				<EmptyState
					title="No audit logs found"
					description="Try adjusting your filters or checking back later."
				/>
			) : (
				<div className="flex flex-col gap-4">
					<Table aria-label="Audit logs">
						<Table.ScrollContainer>
							<Table.Content>
								<Table.Header>
									<Table.Column isRowHeader>Timestamp</Table.Column>
									<Table.Column>Actor</Table.Column>
									<Table.Column>Action</Table.Column>
									<Table.Column>Entity</Table.Column>
									<Table.Column>Details</Table.Column>
								</Table.Header>
								<Table.Body items={logs}>
									{(log: AuditLog) => (
										<Table.Row key={log.id}>
											<Table.Cell className="whitespace-nowrap">
												{format(
													new Date(log.timestamp),
													"MMM d, yyyy HH:mm:ss",
												)}
											</Table.Cell>
											<Table.Cell>
												<div className="flex flex-col">
													<span className="font-medium">
														{log.actorEmail ?? "System"}
													</span>
													<span className="text-xs text-default-400 capitalize">
														{log.actorType}
													</span>
												</div>
											</Table.Cell>
											<Table.Cell>
												<span className="capitalize">{log.actionType}</span>
											</Table.Cell>
											<Table.Cell>
												<div className="flex flex-col">
													<span className="capitalize">
														{log.entityType.replace("_", " ")}
													</span>
													<span
														className="text-xs text-default-400 font-mono"
														title={log.entityId}>
														{log.entityId.substring(0, 8)}...
													</span>
												</div>
											</Table.Cell>
											<Table.Cell>
												<div className="max-w-xs truncate text-sm text-default-500">
													{log.changes
														? JSON.stringify(log.changes)
														: "No details"}
												</div>
											</Table.Cell>
										</Table.Row>
									)}
								</Table.Body>
							</Table.Content>
						</Table.ScrollContainer>
					</Table>

					{totalPages > 1 && (
						<div className="flex justify-center w-full">
							<Pagination>
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											isDisabled={page <= 1}
											onPress={() => setPage((p) => Math.max(1, p - 1))}>
											Previous
										</PaginationPrevious>
									</PaginationItem>
									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.filter((p) => {
											if (totalPages <= 7) return true;
											if (p === 1 || p === totalPages) return true;
											if (Math.abs(p - page) <= 1) return true;
											return false;
										})
										.reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
											if (i > 0 && p - (arr[i - 1] as number) > 1) {
												acc.push("ellipsis");
											}
											acc.push(p);
											return acc;
										}, [])
										.map((item, i) =>
											item === "ellipsis" ? (
												<PaginationItem key={`ellipsis-${i}`}>
													<span className="px-2 text-default-400">...</span>
												</PaginationItem>
											) : (
												<PaginationItem key={item}>
													<PaginationLink
														isActive={item === page}
														onPress={() => setPage(item)}>
														{item}
													</PaginationLink>
												</PaginationItem>
											),
										)}
									<PaginationItem>
										<PaginationNext
											isDisabled={page >= totalPages}
											onPress={() => setPage((p) => Math.min(totalPages, p + 1))}>
											Next
										</PaginationNext>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
