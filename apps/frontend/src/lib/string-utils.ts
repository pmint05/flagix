/**
 * String manipulation utilities for UI display.
 *
 * Used for:
 * - Avatar initials extraction
 * - Text truncation in sidebar
 *
 * @module string-utils
 */

/**
 * Extract initials from a display name.
 *
 * Rules:
 * - Single word → first letter.
 * - Two+ words → first letter of first and last word.
 * - Respects maxLength constraint.
 *
 * @param name - Display name.
 * @param maxLength - Maximum characters (default: 2).
 * @returns Uppercase initials string.
 *
 * @example
 * ```ts
 * getInitials("Acme Corporation")  // "AC"
 * getInitials("Flagix")            // "F"
 * getInitials("John Doe Smith")    // "JS"
 * getInitials("")                  // "?"
 * ```
 */
export function getInitials(name: string, maxLength = 2): string {
	const trimmed = name.trim();
	if (!trimmed) return "?";

	const words = trimmed.split(/\s+/).filter(Boolean);

	if (words.length === 1) {
		return words[0].charAt(0).toUpperCase();
	}

	return words
		.filter((_, i, arr) => i === 0 || i === arr.length - 1)
		.map((w) => w.charAt(0).toUpperCase())
		.join("")
		.slice(0, maxLength);
}

/**
 * Truncate text with ellipsis, preserving the end when possible.
 *
 * @param text - Text to truncate.
 * @param maxLength - Maximum visible characters (including ellipsis).
 * @returns Truncated string with "…" if exceeds maxLength.
 *
 * @example
 * ```ts
 * truncateText("My Project Name", 12)  // "My Project…"
 * truncateText("Short", 12)            // "Short"
 * ```
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 1)}…`;
}
