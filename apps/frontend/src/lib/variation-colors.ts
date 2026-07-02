export const TAILWIND_COLORS_500: Record<
	string,
	{ hex: string; textClass: string; bgClass: string; borderClass: string }
> = {
	blue: {
		hex: "#3b82f6",
		textClass: "text-blue-500",
		bgClass: "bg-blue-500",
		borderClass: "border-blue-500",
	},
	amber: {
		hex: "#f59e0b",
		textClass: "text-amber-500",
		bgClass: "bg-amber-500",
		borderClass: "border-amber-500",
	},
	red: {
		hex: "#ef4444",
		textClass: "text-red-500",
		bgClass: "bg-red-500",
		borderClass: "border-red-500",
	},
	green: {
		hex: "#22c55e",
		textClass: "text-green-500",
		bgClass: "bg-green-500",
		borderClass: "border-green-500",
	},
	purple: {
		hex: "#a855f7",
		textClass: "text-purple-500",
		bgClass: "bg-purple-500",
		borderClass: "border-purple-500",
	},
	sky: {
		hex: "#38bdf8",
		textClass: "text-sky-400",
		bgClass: "bg-sky-400",
		borderClass: "border-sky-400",
	},
	pink: {
		hex: "#ec4899",
		textClass: "text-pink-500",
		bgClass: "bg-pink-500",
		borderClass: "border-pink-500",
	},
	lime: {
		hex: "#84cc16",
		textClass: "text-lime-500",
		bgClass: "bg-lime-500",
		borderClass: "border-lime-500",
	},
	indigo: {
		hex: "#4f46e5",
		textClass: "text-indigo-600",
		bgClass: "bg-indigo-600",
		borderClass: "border-indigo-600",
	},
	yellow: {
		hex: "#ca8a04",
		textClass: "text-yellow-600",
		bgClass: "bg-yellow-600",
		borderClass: "border-yellow-600",
	},
	teal: {
		hex: "#14b8a6",
		textClass: "text-teal-500",
		bgClass: "bg-teal-500",
		borderClass: "border-teal-500",
	},
	fuchsia: {
		hex: "#d946ef",
		textClass: "text-fuchsia-500",
		bgClass: "bg-fuchsia-500",
		borderClass: "border-fuchsia-500",
	},
};

export const COLOR_KEYS = Object.keys(TAILWIND_COLORS_500);

export function getVariationColor(index: number): string {
	const key = COLOR_KEYS[Math.abs(index) % COLOR_KEYS.length];
	return TAILWIND_COLORS_500[key]?.textClass ?? "text-default-400";
}

export function getVariationBgColor(index: number): string {
	const key = COLOR_KEYS[Math.abs(index) % COLOR_KEYS.length];
	return TAILWIND_COLORS_500[key]?.bgClass ?? "bg-default-400";
}

export function getVariationColorClass(colorName?: string | null, index: number = 0): string {
	if (colorName && TAILWIND_COLORS_500[colorName]) {
		return TAILWIND_COLORS_500[colorName].textClass;
	}
	return getVariationColor(index);
}

export function getVariationBgColorClass(colorName?: string | null, index: number = 0): string {
	if (colorName && TAILWIND_COLORS_500[colorName]) {
		return TAILWIND_COLORS_500[colorName].bgClass;
	}
	return getVariationBgColor(index);
}
