import { PieChart, Pie, ResponsiveContainer, Legend } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { getVariationChartColor, resolveVariationColor } from "./chart-colors";

interface VariationData {
	variationKey: string;
	count: number;
	percentage: number;
	color: string | null;
}

interface VariationDistributionChartProps {
	data: VariationData[];
}

export function VariationDistributionChart({
	data,
}: VariationDistributionChartProps) {
	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center h-64 text-default-400 text-sm">
				No evaluation data yet
			</div>
		);
	}

	const chartData = data.map((d) => ({
		name: d.variationKey,
		value: d.count,
		fill: resolveVariationColor(d.color) ?? getVariationChartColor(d.variationKey),
	}));

	return (
		<div className="h-64">
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={chartData}
						cx="50%"
						cy="50%"
						innerRadius={50}
						outerRadius={80}
						paddingAngle={2}
						dataKey="value"
					/>
					<ChartTooltip />
					<Legend />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
