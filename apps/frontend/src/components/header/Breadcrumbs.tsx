import { Link, useMatches } from "@tanstack/react-router";
import { CaretRightIcon } from "@phosphor-icons/react";
import { useContextStore } from "#/stores";
import { useFlag } from "#/features/flags/api";
import {
	BREADCRUMB_CONFIG,
	resolveLabel,
	resolveHref,
} from "./breadcrumb-config";
import { Breadcrumbs as BRH } from "@heroui/react";
import { useIsMobile } from "#/hooks/useIsMobile";

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
		<BRH aria-label="Breadcrumb">
			{isMobile ? (
				<BRH.Item>
					<span className="font-medium text-foreground">
						{segments[segments.length - 1]
							? resolveLabel(segments[segments.length - 1].label, params)
							: "Dashboard"}
					</span>
				</BRH.Item>
			) : (
				segments.map((segment, index) => {
					const isLast = index === segments.length - 1;
					const rawLabel = resolveLabel(segment.label, params);
					const href = resolveHref(segment.href, params);

					let displayLabel = rawLabel;
					let isLoading = false;

					// Resolve project name synchronously from store
					if (segment.resolveParam === "projectId") {
						if (selectedProject) {
							displayLabel = selectedProject.name;
						} else {
							isLoading = true;
						}
					}

					return (
						<BRH.Item key={index} className="flex items-center gap-1">
							{segment.resolveParam === "flagId" ? (
								<FlagNameResolver
									flagId={params.flagId}
									fallback={rawLabel}
									isLast={isLast}
									href={href}
								/>
							) : isLast ? (
								<span
									className={`font-medium text-foreground ${
										isLoading ? "opacity-60" : ""
									}`}>
									{displayLabel}
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
				})
			)}
		</BRH>
	);
}

/**
 * Extracted component to fetch and resolve flag name
 * using TanStack Query, respecting Hook rules.
 */
function FlagNameResolver({
	flagId,
	fallback,
	isLast,
	href,
}: {
	flagId: string;
	fallback: string;
	isLast: boolean;
	href?: string;
}) {
	const { data: flag, isLoading } = useFlag(flagId);
	const displayLabel = flag?.name || fallback;

	if (isLast) {
		return (
			<span
				className={`font-medium text-foreground ${
					isLoading ? "opacity-60" : ""
				}`}>
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
