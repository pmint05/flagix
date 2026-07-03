import { Link, useMatches } from "@tanstack/react-router";
import { useContextStore } from "#/stores";
import { useFlagByKey } from "#/features/flags/api";
import {
	BREADCRUMB_CONFIG,
	resolveLabel,
	resolveHref,
} from "./breadcrumb-config";
import { Breadcrumbs as BRH } from "@heroui/react";
import { useIsMobile } from "#/hooks/useIsMobile";
import { Skeleton } from "@heroui/react";

export function Breadcrumbs() {
	const matches = useMatches();
	const deepestMatch = matches[matches.length - 1];
	const routeId = deepestMatch?.routeId;

	// Merge params from all matches
	const params = matches.reduce(
		(acc, match) => ({ ...acc, ...match.params }),
		{} as Record<string, string>,
	);

	const segments = BREADCRUMB_CONFIG[routeId];
	const selectedProject = useContextStore((s) => s.selectedProject);
	const isMobile = useIsMobile();

	if (!segments) {
		return (
			<div className="flex items-center text-sm font-medium text-foreground">
				Dashboard
			</div>
		);
	}

	return (
		<BRH aria-label="Breadcrumb" items={isMobile ? (segments[segments.length - 1] ? [{ ...segments[segments.length - 1], id: "mobile-0" }] : []) : segments.map((s, i) => ({ ...s, id: i.toString() }))}>
			{(segment: any) => {
				const index = isMobile ? segments.length - 1 : parseInt(segment.id, 10);
				const isLast = isMobile ? true : index === segments.length - 1;
				const originalSegment = segments[index] || segment;
				const rawLabel = resolveLabel(originalSegment.label, params);
				const href = resolveHref(originalSegment.href, params);

				let displayLabel = rawLabel;
				let isLoading = false;

				if (originalSegment.resolveParam === "projectId") {
					if (selectedProject) {
						displayLabel = selectedProject.name;
					} else {
						isLoading = true;
					}
				}

				return (
					<BRH.Item key={segment.id} className="flex items-center gap-1">
						{originalSegment.resolveParam === "flagSlug" ? (
							<FlagNameResolver
								flagSlug={params.flagSlug}
								fallback={rawLabel}
								isLast={isLast}
								href={href}
							/>
						) : isLast ? (
							<span
								className={`font-medium text-foreground ${
									isLoading ? "opacity-60" : ""
								}`}>
								{isMobile ? (segment ? displayLabel : "Dashboard") : displayLabel}
							</span>
						) : (
							<Link
								to={href as string}
								className="transition-colors hover:text-foreground">
								{displayLabel}
							</Link>
						)}
					</BRH.Item>
				);
			}}
		</BRH>
	);
}

/**
 * Extracted component to fetch and resolve flag name
 * using TanStack Query, respecting Hook rules.
 */
function FlagNameResolver({
	flagSlug,
	fallback,
	isLast,
	href,
}: {
	flagSlug: string;
	fallback: string;
	isLast: boolean;
	href?: string;
}) {
	const { data: flag, isPending } = useFlagByKey(flagSlug);
	const displayLabel = flag?.name || fallback;

	if (isPending) {
		return <Skeleton className="h-4 w-24 rounded-lg" />;
	}

	if (isLast) {
		return (
			<span
				className={`font-medium text-foreground`}>
				{displayLabel}
			</span>
		);
	}

	return (
		<Link
			to={href as string}
			className="transition-colors hover:text-foreground">
			{displayLabel}
		</Link>
	);
}
