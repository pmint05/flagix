"use client";
import { HexagonIcon } from "@phosphor-icons/react";
import { getVariationColorClass } from "@/lib/variation-colors";

interface VariationDotProps {
	index?: number;
	color?: string | null;
	className?: string;
}

export function VariationDot({ index = 0, color, className }: VariationDotProps) {
	return (
		<HexagonIcon
			weight="fill"
			className={`${getVariationColorClass(color, index)} ${className ?? ""}`}
		/>
	);
}
