import { TAILWIND_COLORS_500 } from "@/lib/variation-colors";

const FALLBACK_COLORS = [
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
] as const;

const colorCache = new Map<string, string>();

export function getVariationChartColor(key: string): string {
	if (colorCache.has(key)) return colorCache.get(key)!;

	let hash = 0;
	for (let i = 0; i < key.length; i++) {
		hash = (hash * 31 + key.charCodeAt(i)) | 0;
	}

	const color = FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
	colorCache.set(key, color);
	return color;
}

export function resolveVariationColor(colorName: string | null | undefined): string | null {
	if (!colorName) return null;
	return TAILWIND_COLORS_500[colorName]?.hex ?? null;
}
