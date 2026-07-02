import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

interface TrendDataPoint {
	timestamp: string;
	count: number;
	byVariation: Record<string, number>;
}

interface EvaluationTrendChartProps {
	data: TrendDataPoint[];
}

const COLORS = [
	"#22c55e",
	"#ef4444",
	"#3b82f6",
	"#f59e0b",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#84cc16",
];

export function EvaluationTrendChart({ data }: EvaluationTrendChartProps) {
	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 text-default-400 text-sm">
				No evaluation data yet
			</div>
		);
	}

	const allVariationKeys = new Set<string>();
	for (const d of data) {
		for (const vk of Object.keys(d.byVariation)) {
			allVariationKeys.add(vk);
		}
	}

	const chartData = data.map((d) => {
		const formatted: Record<string, string | number> = {
			time: new Date(d.timestamp).toLocaleTimeString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
				month: "short",
				day: "numeric",
			}),
		};
		for (const vk of allVariationKeys) {
			formatted[vk] = d.byVariation[vk] || 0;
		}
		formatted["Total"] = d.count;
		return formatted;
	});

	const variationKeys = Array.from(allVariationKeys);

	if (variationKeys.length === 0) {
		return (
			<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="time" tick={{ fontSize: 11 }} />
						<YAxis tick={{ fontSize: 11 }} />
						<ChartTooltip />
						<Area
							type="monotone"
							dataKey="Total"
							stroke="#3b82f6"
							fill="#3b82f6"
							fillOpacity={0.3}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		);
	}

	return (
		<div className="h-64">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="time" tick={{ fontSize: 11 }} />
					<YAxis tick={{ fontSize: 11 }} />
					<ChartTooltip />
					<Legend />
					{variationKeys.map((vk, i) => (
						<Area
							key={vk}
							type="monotone"
							dataKey={vk}
							stackId="1"
							stroke={COLORS[i % COLORS.length]}
							fill={COLORS[i % COLORS.length]}
							fillOpacity={0.3}
						/>
					))}
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
