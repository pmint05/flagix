import { Button } from "@heroui/react";
import { ArrowClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";

interface ErrorProps {
	error: Error;
	reset?: () => void;
}

export function AuthenticatedErrorBoundary({ error, reset }: ErrorProps) {
	const router = useRouter();
	const canGoBack = useCanGoBack();
	const navigate = useNavigate();

	const handleGoBack = () => {
		if (canGoBack) {
			if (window !== undefined && window.history.length > 1) {
				window.history.back();
			} else {
				navigate({ to: "/" });
			}
		} else {
			navigate({ to: "/" });
		}
	};

	const handleTryAgain = () => {
		if (reset) {
			reset();
		} else {
			router.invalidate();
		}
	};

	return (
		<div className="flex h-full w-full items-center justify-center">
			<div className="flex flex-col items-center text-center max-w-md">
				<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
					<WarningCircleIcon weight="duotone" className="h-6 w-6 text-danger" />
				</div>

				<h2 className="mb-2 text-xl font-semibold text-foreground">
					Something went wrong
				</h2>

				<p className="mb-4 text-sm text-foreground-600">
					An error occurred while loading this page.
				</p>

				<div className="mb-6 w-full rounded-lg bg-danger-50/50 p-3 text-left dark:bg-danger/10">
					<p className="text-xs font-mono text-danger wrap-break-word">
						{error.message || "Unknown error occurred"}
					</p>
				</div>

				<div className="flex gap-3">
					<Button variant="outline" size="sm" onPress={handleGoBack}>
						Go back
					</Button>
					<Button variant="primary" size="sm" onPress={handleTryAgain}>
						<ArrowClockwiseIcon weight="bold" size={16} className="mr-1" />
						Try again
					</Button>
				</div>
			</div>
		</div>
	);
}

export const ErrorBoundary = AuthenticatedErrorBoundary;
