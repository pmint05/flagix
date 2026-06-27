import type { ComponentType } from "react";

export interface BreadcrumbSegment {
	/** Static label or function to resolve from route params */
	label: string | ((params: Record<string, string>) => string);
	/** Static href or function to build href from params */
	href?: string | ((params: Record<string, string>) => string);
	/** Optional icon component */
	icon?: ComponentType<{ size?: number; weight?: string }>;
	/**
	 * If set, this segment's label should be resolved by fetching
	 * data. The breadcrumb component will use this key to determine
	 * what to resolve (e.g., 'projectSlug' -> use project name).
	 */
	resolveParam?: string;
}

/**
 * Map from TanStack Router route IDs to their breadcrumb definitions.
 * Route IDs must match exactly with those in routeTree.gen.ts.
 */
export const BREADCRUMB_CONFIG: Record<string, BreadcrumbSegment[]> = {
	"/_authenticated/": [{ label: "Dashboard" }],
	"/_authenticated/projects/": [{ label: "Projects", href: "/projects" }],
	"/_authenticated/projects/$projectSlug/flags": [
		// { label: "Projects", href: "/projects" },
		{
			label: (p) => p.projectSlug,
			href: (p) => `/projects/${p.projectSlug}/flags`,
			resolveParam: "projectSlug",
		},
		{ label: "Feature Flags" },
	],
	"/_authenticated/projects/$projectSlug/flags/$flagId": [
		// { label: "Projects", href: "/projects" },
		{
			label: (p) => p.projectSlug,
			href: (p) => `/projects/${p.projectSlug}/flags`,
			resolveParam: "projectSlug",
		},
		{ label: "Feature Flags", href: (p) => `/projects/${p.projectSlug}/flags` },
		{ label: (p) => p.flagId, resolveParam: "flagId" },
	],
	"/_authenticated/projects/$projectSlug/environments": [
		// { label: "Projects", href: "/projects" },
		{
			label: (p) => p.projectSlug,
			href: (p) => `/projects/${p.projectSlug}/flags`,
			resolveParam: "projectSlug",
		},
		{ label: "Environments" },
	],
	"/_authenticated/projects/$projectSlug/sdk-keys": [
		// { label: "Projects", href: "/projects" },
		{
			label: (p) => p.projectSlug,
			href: (p) => `/projects/${p.projectSlug}/flags`,
			resolveParam: "projectSlug",
		},
		{ label: "SDK Keys" },
	],
};

/**
 * Resolve a static or dynamic label.
 */
export function resolveLabel(
	label: string | ((params: Record<string, string>) => string),
	params: Record<string, string>,
): string {
	return typeof label === "function" ? label(params) : label;
}

/**
 * Resolve a static or dynamic href.
 */
export function resolveHref(
	href: string | ((params: Record<string, string>) => string) | undefined,
	params: Record<string, string>,
): string | undefined {
	if (!href) return undefined;
	return typeof href === "function" ? href(params) : href;
}
