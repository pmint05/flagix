import {
	type ColumnDef,
	type SortingState,
	type PaginationState,
	type RowSelectionState,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Checkbox, EmptyState, Table } from "@heroui/react";
import type { Selection, SortDescriptor } from "@heroui/react";
import { useMemo, useState } from "react";
import type { TableState } from "@/hooks/useDataTableUrlSync";
import { DataTableFooter } from "./DataTableFooter";
import { TrayIcon } from "@phosphor-icons/react";

interface DataTableProps<TData> {
	data: TData[];
	columns: ColumnDef<TData, unknown>[];
	state: TableState;
	onStateChange: (updates: Partial<TableState>) => void;
	pageCount?: number;
	rowCount?: number;
	emptyState?: React.ReactNode;
	isHeaderSticky?: boolean;
	isCompact?: boolean;
	allowsResizing?: boolean;
	enableRowSelection?: boolean;
	selectedRowIds?: string[];
	onSelectionChange?: (selectedRowIds: string[]) => void;
	showPagination?: boolean;
	showPageSizeSelector?: boolean;
	showPageJump?: boolean;
	getRowId?: (row: TData) => string;
}

function toSortDescriptor(sorting: SortingState): SortDescriptor | undefined {
	const first = sorting[0];
	if (!first) return undefined;
	return {
		column: first.id,
		direction: first.desc ? "descending" : "ascending",
	};
}

function toSortingState(descriptor: SortDescriptor): SortingState {
	return [
		{
			id: descriptor.column as string,
			desc: descriptor.direction === "descending",
		},
	];
}

export function DataTable<TData>({
	data,
	columns,
	state,
	onStateChange,
	pageCount,
	rowCount,
	emptyState,
	isHeaderSticky = false,
	isCompact = false,
	allowsResizing = false,
	enableRowSelection = false,
	selectedRowIds,
	onSelectionChange,
	showPagination = true,
	showPageSizeSelector = true,
	showPageJump = false,
	getRowId,
}: DataTableProps<TData>) {
	const [internalSelection, setInternalSelection] = useState<Selection>(
		new Set(),
	);

	const sorting: SortingState = state.sortBy
		? [{ id: state.sortBy, desc: state.sortDir === "desc" }]
		: [];

	const pagination: PaginationState = {
		pageIndex: state.page - 1,
		pageSize: state.pageSize,
	};

	const rowSelection: RowSelectionState = useMemo(() => {
		if (!selectedRowIds) return {};
		return Object.fromEntries(selectedRowIds.map((id) => [id, true]));
	}, [selectedRowIds]);

	const resolvedSelectionKeys: Selection = selectedRowIds
		? new Set(selectedRowIds)
		: internalSelection;

	const table = useReactTable({
		data,
		columns,
		state: { sorting, pagination, globalFilter: state.query, rowSelection },
		onSortingChange: (updater) => {
			const next = typeof updater === "function" ? updater(sorting) : updater;
			if (next.length > 0) {
				onStateChange({
					sortBy: next[0].id,
					sortDir: next[0].desc ? "desc" : "asc",
				});
			} else {
				onStateChange({ sortBy: undefined, sortDir: undefined });
			}
		},
		onPaginationChange: (updater) => {
			const next =
				typeof updater === "function" ? updater(pagination) : updater;
			onStateChange({ page: next.pageIndex + 1, pageSize: next.pageSize });
		},
		onGlobalFilterChange: (f) => onStateChange({ query: String(f || "") }),
		getRowId: getRowId ? (row) => getRowId(row as TData) : undefined,
		getCoreRowModel: getCoreRowModel(),
		enableRowSelection,
		manualPagination: pageCount !== undefined,
		pageCount,
	});

	const sortDescriptor = useMemo(() => toSortDescriptor(sorting), [sorting]);
	const rows = table.getRowModel().rows;
	const resolvedPageCount = pageCount ?? table.getPageCount();

	const handleSelectionChange = (keys: Selection) => {
		if (selectedRowIds === undefined) {
			setInternalSelection(keys);
		}
		if (onSelectionChange) {
			if (keys === "all") {
				onSelectionChange(rows.map((r) => r.id));
			} else {
				onSelectionChange(Array.from(keys).map(String));
			}
		}
	};

	const selectionColumn: ColumnDef<TData, unknown> = {
		id: "__selection",
		size: 40,
		header: () => (
			<Checkbox aria-label="Select all" slot="selection">
				<Checkbox.Content>
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
				</Checkbox.Content>
			</Checkbox>
		),
		cell: ({ row }) => (
			<Checkbox
				aria-label={`Select row ${row.id}`}
				isSelected={row.getIsSelected()}
				onPress={() => row.toggleSelected()}
				slot="selection"
				variant="secondary">
				<Checkbox.Content>
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
				</Checkbox.Content>
			</Checkbox>
		),
	};

	const allColumns = enableRowSelection
		? [selectionColumn, ...columns]
		: columns;

	const content = (
		<Table.Content
			aria-label="Data table"
			className={allowsResizing ? "min-w-175" : undefined}
			selectedKeys={enableRowSelection ? resolvedSelectionKeys : undefined}
			selectionMode={enableRowSelection ? "multiple" : undefined}
			sortDescriptor={sortDescriptor}
			onSelectionChange={enableRowSelection ? handleSelectionChange : undefined}
			onSortChange={(d) => {
				const newSorting = toSortingState(d);
				if (newSorting.length > 0) {
					onStateChange({
						sortBy: newSorting[0].id,
						sortDir: newSorting[0].desc ? "desc" : "asc",
					});
				} else {
					onStateChange({ sortBy: undefined, sortDir: undefined });
				}
			}}>
			<Table.Header
				className={
					isHeaderSticky ? "sticky top-0 z-20 bg-background" : undefined
				}>
				{table.getHeaderGroups()[0]?.headers.map((header, idx) => {
					const col = allColumns[idx];
					const colDef = col as ColumnDef<TData, unknown> & {
						enableSorting?: boolean;
					};
					const canSort =
						colDef?.enableSorting !== false && header.column.getCanSort();
					return (
						<Table.Column
							key={header.id}
							id={header.id}
							allowsSorting={canSort}
							isRowHeader={
								!enableRowSelection && idx === (enableRowSelection ? 1 : 0)
							}>
							{canSort ? (
								({ sortDirection }) => (
									<Table.SortableColumnHeader sortDirection={sortDirection}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</Table.SortableColumnHeader>
								)
							) : (
								<>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
									{allowsResizing && <Table.ColumnResizer />}
								</>
							)}
						</Table.Column>
					);
				})}
			</Table.Header>
			<Table.Body
				renderEmptyState={() =>
					emptyState ?? (
						<EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center min-h-50">
							<TrayIcon className="size-8 text-muted" weight="duotone" />
							<span className="text-muted">No data available</span>
						</EmptyState>
					)
				}>
				{rows.map((row) => (
					<Table.Row key={row.id} id={row.id}>
						{row.getVisibleCells().map((cell) => (
							<Table.Cell
								key={cell.id}
								className={isCompact ? "py-1 text-sm" : undefined}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</Table.Cell>
						))}
					</Table.Row>
				))}
			</Table.Body>
		</Table.Content>
	);

	const resizableWrapper = allowsResizing ? (
		<Table.ResizableContainer>
			<Table.ScrollContainer>{content}</Table.ScrollContainer>
		</Table.ResizableContainer>
	) : (
		<Table.ScrollContainer>{content}</Table.ScrollContainer>
	);

	return (
		<Table>
			{resizableWrapper}
			<Table.Footer>
				<DataTableFooter
					pageIndex={state.page - 1}
					pageCount={resolvedPageCount}
					pageSize={state.pageSize}
					rowCount={rowCount}
					showPagination={showPagination}
					showPageSizeSelector={showPageSizeSelector}
					showPageJump={showPageJump}
					onPageChange={(p) => onStateChange({ page: p })}
					onPageSizeChange={(ps) => onStateChange({ pageSize: ps, page: 1 })}
				/>
			</Table.Footer>
		</Table>
	);
}
