import { useThemeStore } from "#/stores";
import { Tooltip } from "recharts";

interface ChartTooltipProps {
	active?: boolean;
	payload?: Array<{ name: string; value: number; color?: string }>;
	label?: string;
	valueFormatter?: (value: number) => string;
}

function ChartTooltipContent({
	active,
	payload,
	label,
	valueFormatter,
}: ChartTooltipProps) {
	if (!active || !payload || !payload.length) {
		return null;
	}
	const fmt = valueFormatter ?? ((v: number) => v.toLocaleString());
	const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
	const isDark = resolvedTheme === "dark";

	return (
		<div
			className={`rounded-2xl border px-3 py-2 text-xs shadow-lg ${
				isDark
					? "bg-zinc-900 border-zinc-700 text-zinc-100"
					: "bg-white border-zinc-200 text-zinc-900"
			}`}>
			{label && (
				<p
					className={`mb-1 font-medium ${
						isDark ? "text-zinc-300" : "text-zinc-500"
					}`}>
					{label}
				</p>
			)}
			{payload.map((entry, i) => (
				<div key={i} className="flex items-center gap-2">
					<span
						className="inline-block h-2 w-2 rounded-full shrink-0"
						style={{ backgroundColor: entry.color }}
					/>
					<span className="flex-1">{entry.name}</span>
					<span className="font-mono font-medium tabular-nums">
						{fmt(entry.value)}
					</span>
				</div>
			))}
		</div>
	);
}
export function ChartTooltip() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === "dark";
  const fillColor = isDark ? "#f9fafb20" : "#11182710";
	return (
		<Tooltip
			cursor={{ fill: fillColor }}
			isAnimationActive={false}
			content={<ChartTooltipContent />}
		/>
	);
}
