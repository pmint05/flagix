import { createPersistedStore } from "./ssr";

export type Theme = "system" | "light" | "dark";

interface ThemeState {
	/** Current theme preference. */
	theme: Theme;
	resolvedTheme: "light" | "dark";

	/** Update theme preference and apply to DOM. */
	setTheme: (theme: Theme) => void;
}

/**
 * Resolve the effective theme (light or dark) from the current preference.
 * When "system", defers to `prefers-color-scheme` media query.
 */
export function resolveEffectiveTheme(theme: Theme): "light" | "dark" {
	if (theme !== "system") return theme;
	if (typeof window === "undefined") return "dark"; // SSR default
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

/**
 * Apply the given theme to the `<html>` element's class list.
 */
export function applyThemeToDOM(theme: Theme): void {
	if (typeof document === "undefined") return;

	const effective = resolveEffectiveTheme(theme);
	const html = document.documentElement;

	html.classList.remove("light", "dark");
	html.classList.add(effective);
}

export const useThemeStore = createPersistedStore<ThemeState>(
	(set) => ({
		theme: "dark",
		resolvedTheme: "dark",
		setTheme: (theme) => {
			applyThemeToDOM(theme);
			set({ theme, resolvedTheme: resolveEffectiveTheme(theme) });
		},
	}),
	{
		name: "flagix.theme",
		onRehydrateStorage: () => (state) => {
			// After persist restores state from localStorage, apply the theme to
			// the DOM. Without this the <html> class stays at the SSR default
			// ("dark") because persist only merges data — it does not re-run setTheme.
			if (state?.theme) {
				applyThemeToDOM(state.theme);
			}
		},
	},
);
