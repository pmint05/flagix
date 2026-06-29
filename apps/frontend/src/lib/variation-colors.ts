export const VARIATION_COLORS = [
	"text-blue-500",
	"text-amber-500",
	"text-purple-500",
	"text-emerald-500",
	"text-rose-500",
	"text-cyan-500",
	"text-orange-500",
	"text-violet-500",
	"text-teal-500",
	"text-pink-500",
] as const;

export function getVariationColor(index: number): string {
	return VARIATION_COLORS[index % VARIATION_COLORS.length];
}
