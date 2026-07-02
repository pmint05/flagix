import { PieChart, Pie, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartTooltip } from "./ChartTooltip";

interface VariationData {
  variationKey: string;
  count: number;
  percentage: number;
}

interface VariationDistributionChartProps {
  data: VariationData[];
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
  "#f97316",
  "#6366f1",
];

export function VariationDistributionChart({ data }: VariationDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-default-400 text-sm">
        No evaluation data yet
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    name: d.variationKey,
    value: d.count,
    fill: COLORS[i % COLORS.length],
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
          <ChartTooltip
            content={ChartTooltip as any}
            formatter={(_value) => [Number(_value).toLocaleString(), "Evaluations"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
