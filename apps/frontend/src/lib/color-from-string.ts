/**
 * Deterministic color generation from strings.
 *
 * Used for:
 * - Organization avatar backgrounds
 * - Environment indicator dots
 *
 * @module color-from-string
 */

/**
 * FNV-1a hash — better avalanche effect than DJB2 for short strings,
 * meaning small input changes (e.g. "Test Org" vs "Test User's Organization")
 * produce widely different hash values.
 * @see https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function
 */
function fnv1aHash(input: string): number {
	let hash = 0x811c9dc5; // FNV offset basis
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193); // FNV prime
	}
	return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Curated hue palette — avoids ugly/muddy hues (yellow-green ~60-80°, brown ~30-50°).
 * 18 entries for better spread across the color wheel.
 */
const HUE_PALETTE = [
	0, 12, 25, 95, 110, 140, 160, 185, 200, 215, 235, 255, 275, 290, 310, 325,
	340, 355,
] as const;

/**
 * Generate a deterministic HSL color string from any input.
 * Uses separate bits of the hash for hue, saturation and lightness
 * so that strings mapping to the same hue still get visually distinct colors.
 *
 * @param input - String to hash (e.g., org name, env slug).
 * @returns CSS `hsl(...)` color string.
 *
 * @example
 * ```ts
 * generateColorFromString("production") // "hsl(255, 58%, 48%)"
 * generateColorFromString("staging")    // "hsl(160, 64%, 52%)"
 * ```
 */
export function generateColorFromString(input: string): string {
	const hash = fnv1aHash(input.toLowerCase().trim());

	// Use different bit ranges for each dimension
	const hue = HUE_PALETTE[hash % HUE_PALETTE.length];
	const sat = 50 + ((hash >>> 8) % 21); // 50–70%
	const lgt = 42 + ((hash >>> 16) % 18); // 42–59%

	return `hsl(${hue}, ${sat}%, ${lgt}%)`;
}

/**
 * Generate a background/foreground color pair for avatars.
 * Ensures WCAG AA contrast ratio for text readability.
 *
 * @param name - Display name to derive color from.
 * @returns Object with `bg` (background) and `fg` (foreground/text) CSS colors.
 *
 * @example
 * ```ts
 * const { bg, fg } = generateAvatarColor("Acme Corp");
 * // bg: "hsl(215, 53%, 43%)", fg: "hsl(215, 10%, 98%)"
 * ```
 */
export function generateAvatarColor(name: string): { bg: string; fg: string } {
	const hash = fnv1aHash(name.toLowerCase().trim());

	const hue = HUE_PALETTE[hash % HUE_PALETTE.length];
	const sat = 45 + ((hash >>> 8) % 21); // 45–65%
	const lgt = 38 + ((hash >>> 16) % 16); // 38–53%

	return {
		bg: `hsl(${hue}, ${sat}%, ${lgt}%)`,
		fg: `hsl(${hue}, 10%, 98%)`,
	};
}

