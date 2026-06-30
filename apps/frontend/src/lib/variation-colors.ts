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

export const VARIATION_BG_COLORS = [
	"bg-blue-500",
	"bg-amber-500",
	"bg-purple-500",
	"bg-emerald-500",
	"bg-rose-500",
	"bg-cyan-500",
	"bg-orange-500",
	"bg-violet-500",
	"bg-teal-500",
	"bg-pink-500",
] as const;

export function getVariationColor(index: number): string {
	return VARIATION_COLORS[index % VARIATION_COLORS.length];
}

export function getVariationBgColor(index: number): string {
	return VARIATION_BG_COLORS[index % VARIATION_BG_COLORS.length];
}
