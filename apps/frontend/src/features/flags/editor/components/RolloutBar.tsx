"use client";
import { cn, Tooltip } from "@heroui/react";
import { getVariationBgColor } from "@/lib/variation-colors";


interface RolloutBarProps {
	rollouts: Array<{ variationId: string; percentage: number }>;
	variations: Array<{ id: string; key: string; value?: any }>;
	className?: string;
}

export function RolloutBar({
	rollouts,
	variations,
	className,
}: RolloutBarProps) {
	let accumulated = 0;

	const segments = rollouts
		.map((rollout, rIdx) => {
			const vIndex = variations.findIndex(
				(varItem) => varItem.id === rollout.variationId,
			);
			const v = variations[vIndex];
			const pct = Number(rollout.percentage) || 0;

			const start = accumulated;
			accumulated += pct;
			const end = accumulated;

			if (pct === 0) return null;

			const label =
				v?.key || (v?.value !== undefined ? String(v.value) : "unknown");
			const bgColor = getVariationBgColor(vIndex);

			return {
				id: `${rollout.variationId}-${rIdx}`,
				pct,
				start,
				end,
				label,
				bgColor,
			};
		})
		.filter(Boolean) as Array<{
		id: string;
		pct: number;
		start: number;
		end: number;
		label: string;
		bgColor: string;
	}>;

	const total = rollouts.reduce(
		(sum, r) => sum + (Number(r.percentage) || 0),
		0,
	);
	const remaining = 100 - total;

	return (
		<div
			className={cn(
				"flex-1 h-3 rounded-full overflow-hidden flex bg-default border border-divider",
				className,
			)}>
			{segments.map((seg) => (
				<Tooltip key={seg.id} delay={0}>
					<Tooltip.Trigger
						style={{ maxWidth: `${seg.pct}%` }}
						className="w-full">
						<div
							className={cn(
								"h-full w-full transition-all border-r border-divider/20 last:border-r-0 cursor-pointer",
								seg.bgColor,
							)}
						/>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<div className="text-xs font-semibold">
							{seg.label}: {seg.pct}% ({seg.start}% - {seg.end}%)
						</div>
					</Tooltip.Content>
				</Tooltip>
			))}

			{remaining > 0 && (
				<Tooltip>
					<Tooltip.Trigger
						className="w-full"
						style={{ width: `${remaining}%` }}>
						<div className="h-full w-full bg-default cursor-pointer" />
					</Tooltip.Trigger>
					<Tooltip.Content>
						<div className="text-xs font-semibold select-none">
							Next rules: {remaining}% ({100 - remaining}% - 100%)
						</div>
					</Tooltip.Content>
				</Tooltip>
			)}
		</div>
	);
}
