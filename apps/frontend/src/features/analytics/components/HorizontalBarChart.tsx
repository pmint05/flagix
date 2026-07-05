"use client";
import { useMemo, useCallback } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Cell,
	ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

const REASON_PALETTE: Record<string, string> = {
	DEFAULT: "#a1a1aa",
	RULE_MATCH: "#3b82f6",
	FLAG_ARCHIVED: "#f59e0b",
	FLAG_DRAFT: "#f59e0b",
	FLAG_DISABLED: "#f59e0b",
	FLAG_NOT_FOUND: "#ef4444",
	EVALUATION_ERROR: "#ef4444",
	NO_VARIATION: "#ef4444",
	SEGMENT_TARGETING: "#8b5cf6",
	INDIVIDUAL_TARGETING: "#8b5cf6",
	PERCENTAGE_ROLLOUT: "#22c55e",
	KILL_SWITCH: "#ef4444",
};

const FALLBACK_PALETTE = [
	"#3b82f6",
	"#8b5cf6",
	"#22c55e",
	"#f59e0b",
	"#a1a1aa",
	"#ec4899",
	"#06b6d4",
] as const;

function isErrorReason(reason: string): boolean {
	const upper = reason.toUpperCase();
	return (
		upper.includes("ERROR") ||
		upper === "FLAG_NOT_FOUND" ||
		upper === "NO_VARIATION" ||
		upper === "KILL_SWITCH"
	);
}

function reasonColor(reason: string, index: number): string {
	if (isErrorReason(reason)) return "#ef4444";
	return REASON_PALETTE[reason] ?? FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

export interface HorizontalBarItem {
	label: string;
	count: number;
}

interface HorizontalBarChartProps {
	data: HorizontalBarItem[];
	maxItems?: number;
	isError?: (item: HorizontalBarItem) => boolean;
}

export function HorizontalBarChart({
	data,
	maxItems = 15,
	isError,
}: HorizontalBarChartProps) {
	const chartData = useMemo(() => {
		const sorted = [...data]
			.sort((a, b) => b.count - a.count)
			.slice(0, maxItems);
		return sorted.map((item, i) => ({
			...item,
			fill: isError
				? isError(item)
					? "#ef4444"
					: reasonColor(item.label, i)
				: reasonColor(item.label, i),
		}));
	}, [data, maxItems, isError]);

	const renderBar = useCallback(
		(props: any) => {
			const { x = 0, y = 0, width = 0, height = 0, fill } = props;
			if (width <= 0 || height <= 0) return null;
			const r = Math.min(3, height / 2);

			return (
				<rect x={x} y={y} width={width} height={height} rx={r} ry={r} fill={fill} />
			);
		},
		[],
	);

	if (chartData.length === 0) {
		return (
			<div className="flex items-center justify-center h-32 text-default-400 text-sm">
				No data yet
			</div>
		);
	}

	const barHeight = Math.max(16, Math.min(24, 400 / chartData.length));
	const chartHeight = chartData.length * (barHeight + 8);

	return (
		<div style={{ height: Math.max(chartHeight, 120) }}>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={chartData}
					layout="vertical"
					margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
				>
					<XAxis type="number" hide />
					<YAxis
						type="category"
						dataKey="label"
						tick={{ fontSize: 11 }}
						tickLine={false}
						axisLine={false}
						width={140}
						interval={0}
					/>
					<ChartTooltip />
					<Bar
						dataKey="count"
						shape={renderBar}
						barSize={barHeight}
						isAnimationActive={false}
					>
						{chartData.map((entry, index) => (
							<Cell key={index} fill={entry.fill} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
