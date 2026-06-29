"use client";
import { HexagonIcon } from "@phosphor-icons/react";
import { getVariationColor } from "@/lib/variation-colors";

interface VariationDotProps {
	index: number;
	className?: string;
}

export function VariationDot({ index, className }: VariationDotProps) {
	return (
		<HexagonIcon
			weight="fill"
			className={`${getVariationColor(index)} ${className ?? ""}`}
		/>
	);
}
