"use client";
import { cn, Tooltip } from "@heroui/react";
import { getVariationBgColorClass } from "@/lib/variation-colors";

interface RolloutBarProps {
	rollouts: Array<{ variationId: string; percentage: number }>;
	variations: Array<{
		id: string;
		key: string;
		value?: any;
		color?: string | null;
	}>;
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
			const targetId = (
				rollout.variationId ||
				(rollout as any).variation_id ||
				""
			)
				.toString()
				.trim()
				.toLowerCase();
			const vIndex = variations.findIndex((varItem) => {
				const varId = (varItem.id || "").toString().trim().toLowerCase();
				const varKey = (varItem.key || "").toString().trim().toLowerCase();
				return varId === targetId || varKey === targetId;
			});
			const v = variations[vIndex];
			const pct = Number(rollout.percentage) || 0;

			const start = accumulated;
			accumulated += pct;
			const end = accumulated;

			if (pct === 0) return null;

			const label =
				v?.key || (v?.value !== undefined ? String(v.value) : "unknown");
			const bgColor = getVariationBgColorClass(
				v?.color,
				vIndex !== -1 ? vIndex : rIdx,
			);

			return {
				id: `${rollout.variationId || (rollout as any).variation_id}-${rIdx}`,
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
						className="w-full"
						style={{ maxWidth: `${seg.pct}%` }}>
						<div
							className={cn(
								"h-full transition-all border-r border-divider/20 last:border-r-0 cursor-pointer",
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
						style={{ maxWidth: `${remaining}%` }}>
						<div className="h-full bg-default cursor-pointer" />
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
