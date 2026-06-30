import {
	type ColumnDef,
	type SortingState,
	type PaginationState,
	type RowSelectionState,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { Checkbox, EmptyState, Skeleton, Table } from "@heroui/react";
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
	emptyMessage?: string;
	isHeaderSticky?: boolean;
	isCompact?: boolean;
	allowsResizing?: boolean;
	enableRowSelection?: boolean;
	selectedRowIds?: string[];
	onSelectionChange?: (selectedRowIds: string[]) => void;
	showPagination?: boolean;
	showPageSizeSelector?: boolean;
	showPageJump?: boolean;
	isLoading?: boolean;
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
	isLoading = false,
	pageCount,
	rowCount,
	emptyState,
	emptyMessage,
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

	const resolvedSelectionKeys: Selection = selectedRowIds
		? new Set(selectedRowIds)
		: internalSelection;

	const rowSelection: RowSelectionState = useMemo(() => {
		const keys = Array.from(resolvedSelectionKeys);
		return Object.fromEntries(keys.map((id) => [id, true]));
	}, [resolvedSelectionKeys]);

	const selectionColumn: ColumnDef<TData, unknown> = useMemo(
		() => ({
			id: "__selection",
			size: 40,
			header: ({ table }) => (
				<Checkbox 
					aria-label="Select all" 
					slot="selection"
					isSelected={table.getIsAllPageRowsSelected()}
					isIndeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
					onPress={() => table.toggleAllPageRowsSelected()}
				>
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
		}),
		[],
	);

	const allColumns = useMemo(
		() => (enableRowSelection ? [selectionColumn, ...columns] : columns),
		[enableRowSelection, selectionColumn, columns],
	);

	const table = useReactTable({
		data,
		columns: allColumns,
		state: { sorting, pagination, globalFilter: state.query, rowSelection },
		onRowSelectionChange: (updater) => {
			const next = typeof updater === "function" ? updater(rowSelection) : updater;
			const keys = new Set(Object.keys(next).filter((k) => next[k]));
			if (selectedRowIds === undefined) {
				setInternalSelection(keys);
			}
			if (onSelectionChange) {
				onSelectionChange(Array.from(keys));
			}
		},
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

	const content = (
		<Table.Content
			aria-label="Data table"
			className={allowsResizing ? "min-w-175" : undefined}
			selectedKeys={enableRowSelection ? resolvedSelectionKeys : undefined}
			selectionMode={enableRowSelection ? "multiple" : undefined}
			sortDescriptor={sortDescriptor}
			onSelectionChange={() => {}} // Ignore row clicks, selection is handled by Checkbox onPress
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
				className={isHeaderSticky ? "sticky top-0 z-20" : undefined}>
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
										{allowsResizing && (
											<Table.ColumnResizer className="hover:bg-accent" />
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
				items={
					isLoading
						? Array.from({ length: 5 }).map((_, rowIndex) => ({
								id: `skeleton-row-${rowIndex}`,
								isSkeleton: true as const,
								rowIndex,
							}))
						: rows.map((row) => ({
								id: row.id,
								isSkeleton: false as const,
								row,
							}))
				}
				renderEmptyState={() =>
					emptyState ?? (
						<EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center min-h-42">
							<TrayIcon className="size-8 text-muted" weight="duotone" />
							<span className="text-muted">
								{emptyMessage || "No data available"}
							</span>
						</EmptyState>
					)
				}>
				{(item: any) => (
					<Table.Row key={item.id} id={item.id}>
						{item.isSkeleton
							? allColumns.map((_, colIndex) => (
									<Table.Cell
										key={`skeleton-cell-${item.rowIndex}-${colIndex}`}
										className={isCompact ? "py-1" : undefined}>
										<Skeleton
											className="h-6 rounded-2xl!"
											style={{
												width: `${Math.floor(Math.random() * 50) + 50}%`,
											}}
										/>
									</Table.Cell>
								))
							: item.row.getVisibleCells().map((cell: any) => (
									<Table.Cell
										key={cell.id}
										className={isCompact ? "py-1 text-sm" : undefined}>
										{flexRender(
											cell.column.columnDef.cell,
											cell.getContext(),
										)}
									</Table.Cell>
								))}
					</Table.Row>
				)}
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
