import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

interface EnvData {
	environmentName: string;
	totalCount: number;
	errorCount: number;
}

interface EnvironmentComparisonChartProps {
	data: EnvData[];
}

export function EnvironmentComparisonChart({
	data,
}: EnvironmentComparisonChartProps) {
	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center h-48 text-default-400 text-sm">
				No environment data yet
			</div>
		);
	}

	const chartData = data.map((d) => ({
		name: d.environmentName,
		Evaluations: d.totalCount,
		Errors: d.errorCount,
	}));

	return (
		<div className="h-48">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="name" tick={{ fontSize: 11 }} />
					<YAxis tick={{ fontSize: 11 }} />
					<ChartTooltip />
					<Bar dataKey="Evaluations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
					<Bar dataKey="Errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
