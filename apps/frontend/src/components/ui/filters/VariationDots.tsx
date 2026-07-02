import { Chip, cn } from "@heroui/react";

const COLOR_MAP: Record<string, string> = {
	red: "bg-red-500",
	blue: "bg-blue-500",
	amber: "bg-amber-500",
	green: "bg-green-500",
	purple: "bg-purple-500",
	sky: "bg-sky-500",
	pink: "bg-pink-500",
	lime: "bg-lime-500",
	indigo: "bg-indigo-500",
	yellow: "bg-yellow-500",
	teal: "bg-teal-500",
	fuchsia: "bg-fuchsia-500",
};

export interface VariationDotItem {
	id: string;
	key: string;
	color: string | null;
}

interface VariationDotsProps {
	variations: VariationDotItem[];
	max?: number;
	className?: string;
}

export function VariationDots({
	variations,
	max = 4,
	className,
}: VariationDotsProps) {
	const visible = variations.slice(0, max);
	const overflow = Math.max(0, variations.length - max);

	return (
		<div className={cn("flex items-center", className)}>
			<div className="flex -space-x-1">
				{visible.map((v) => (
					<span
						key={v.id}
						title={v.key}
						className={cn(
							"inline-block size-3 rounded-full ring-2 ring-surface",
							COLOR_MAP[v.color ?? ""] ?? "bg-muted-foreground",
						)}
					/>
				))}
			</div>
			{overflow > 0 && (
				<Chip size="sm" variant="secondary" className="ml-1.5">
					+{overflow}
				</Chip>
			)}
		</div>
	);
}
