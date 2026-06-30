import { Button } from "@heroui/react";
import { ArrowClockwiseIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

interface ErrorProps {
	error: Error;
	reset?: () => void;
}

export function AuthErrorBoundary({ error, reset }: ErrorProps) {
	const handleTryAgain = () => {
		if (reset) {
			reset();
		} else {
			window.location.reload();
		}
	};

	return (
		<div className="flex min-h-[80vh] w-full items-center justify-center">
			<div className="flex flex-col items-center text-center max-w-md px-4">
				<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
					<WarningCircleIcon weight="duotone" className="h-8 w-8 text-danger" />
				</div>

				<h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
					Something went wrong
				</h1>

				<p className="mb-2 text-foreground-600">
					We apologize for the inconvenience.
				</p>

				<div className="mb-8 w-full rounded-lg bg-danger-50/50 p-4 text-left dark:bg-danger/10">
					<p className="text-sm font-mono text-danger wrap-break-word">
						{error.message || "Unknown error occurred"}
					</p>
				</div>

				<div className="flex gap-3">
					<Link
						to="/"
						className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-default bg-background hover:bg-default/10 transition-colors">
						Back to home
					</Link>
					<Button variant="primary" onPress={handleTryAgain}>
						<ArrowClockwiseIcon weight="bold" size={18} className="mr-2" />
						Try again
					</Button>
				</div>
			</div>
		</div>
	);
}

export const ErrorBoundary = AuthErrorBoundary;
