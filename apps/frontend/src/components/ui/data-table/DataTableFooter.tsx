import { NumberField, Pagination, Select } from "@heroui/react";
import { Label } from "@heroui/react";
import { ListBox } from "@heroui/react";
import { useMemo, useState } from "react";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200];

interface DataTableFooterProps {
	pageIndex: number;
	pageCount: number;
	pageSize: number;
	rowCount?: number;
	showPagination?: boolean;
	showPageSizeSelector?: boolean;
	showPageJump?: boolean;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
}

export function DataTableFooter({
	pageIndex,
	pageCount,
	pageSize,
	rowCount,
	showPagination = true,
	showPageSizeSelector = true,
	showPageJump = false,
	onPageChange,
	onPageSizeChange,
}: DataTableFooterProps) {
	const [jumpValue, setJumpValue] = useState<number | undefined>(undefined);

	const page = pageIndex + 1;

	const start = pageIndex * pageSize + 1;
	const end =
		rowCount != null
			? Math.min((pageIndex + 1) * pageSize, rowCount)
			: (pageIndex + 1) * pageSize;

	const pages = useMemo(() => {
		const result: (number | "ellipsis")[] = [1];
		if (pageCount > 7) {
			if (page > 3) result.push("ellipsis");
			const s = Math.max(2, page - 1);
			const e = Math.min(pageCount - 1, page + 1);
			for (let i = s; i <= e; i++) result.push(i);
			if (page < pageCount - 2) result.push("ellipsis");
			result.push(pageCount);
		} else {
			for (let i = 2; i <= pageCount; i++) result.push(i);
		}
		return result;
	}, [page, pageCount]);

	const handleJumpSubmit = () => {
		if (jumpValue != null && jumpValue >= 1 && jumpValue <= pageCount) {
			onPageChange(jumpValue);
			setJumpValue(undefined);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleJumpSubmit();
		}
	};

	return (
		<div className="flex items-center justify-between gap-4 px-4 py-3">
			{showPageSizeSelector && (
				<Select
					className="w-32"
					value={String(pageSize)}
					onChange={(key) => {
						if (key != null) onPageSizeChange(Number(key));
					}}>
					<Label>Rows</Label>
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							{PAGE_SIZE_OPTIONS.map((size) => (
								<ListBox.Item
									key={size}
									id={String(size)}
									textValue={String(size)}>
									{size}
									<ListBox.ItemIndicator />
								</ListBox.Item>
							))}
						</ListBox>
					</Select.Popover>
				</Select>
			)}

			{showPagination && pageCount > 0 && (
				<Pagination size="sm">
					{rowCount != null && (
						<Pagination.Summary>
							{start} to {end} of {rowCount} results
						</Pagination.Summary>
					)}
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.Previous
								isDisabled={page === 1}
								onPress={() => onPageChange(page - 1)}>
								<Pagination.PreviousIcon />
								Prev
							</Pagination.Previous>
						</Pagination.Item>
						{pages.map((p, i) =>
							p === "ellipsis" ? (
								<Pagination.Item key={`ellipsis-${i}`}>
									<Pagination.Ellipsis />
								</Pagination.Item>
							) : (
								<Pagination.Item key={p}>
									<Pagination.Link
										isActive={p === page}
										onPress={() => onPageChange(p)}>
										{p}
									</Pagination.Link>
								</Pagination.Item>
							),
						)}
						<Pagination.Item>
							<Pagination.Next
								isDisabled={page === pageCount}
								onPress={() => onPageChange(page + 1)}>
								Next
								<Pagination.NextIcon />
							</Pagination.Next>
						</Pagination.Item>
					</Pagination.Content>
				</Pagination>
			)}

			{showPageJump && pageCount > 0 && (
				<NumberField
					className="w-28"
					minValue={1}
					maxValue={pageCount}
					value={jumpValue}
					onChange={setJumpValue}
					onKeyDown={handleKeyDown}>
					<Label>Page</Label>
					<NumberField.Group>
						<NumberField.Input className="w-20" />
					</NumberField.Group>
				</NumberField>
			)}
		</div>
	);
}
