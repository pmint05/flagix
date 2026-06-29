import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Skeleton, Button } from "@heroui/react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useFlagByKey } from "@/features/flags/api";
import { FlagEditorLayout } from "@/features/flags/editor/FlagEditorLayout";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectSlug/flags/$flagSlug",
)({
	validateSearch: z.object({
		tab: z
			.enum(["targeting", "variations", "preview", "monitoring"])
			.optional(),
	}),
	component: FlagEditorPage,
});

function FlagEditorPage() {
	const match = Route.useMatch();
	const { projectSlug, flagSlug } = match.params;
	const { data: flag, isPending, isError } = useFlagByKey(flagSlug);

	if (isPending) {
		return (
			<div className="p-6 space-y-6">
				<Skeleton className="h-8 w-64 rounded-lg" />
				<Skeleton className="h-125 w-full rounded-lg" />
			</div>
		);
	}

	if (isError || !flag) {
		return (
			<div className="p-6 space-y-6">
				<div className="space-y-2">
					<div>
						<h1 className="text-2xl font-bold text-foreground">
							Flag Not Found
						</h1>
						<p className="mt-1 text-sm text-default-500">
							The feature flag you're looking for doesn't exist or has been
							deleted.
						</p>
					</div>
					<Button variant="outline">
						<Link
							to="/projects/$projectSlug/flags"
							params={{ projectSlug }}
							className="flex items-center gap-2">
							<ArrowLeftIcon className="h-4 w-4" /> Return to Flags
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="z-10 w-full overflow-hidden">
			<FlagEditorLayout flag={flag} projectSlug={projectSlug} />
		</div>
	);
}
