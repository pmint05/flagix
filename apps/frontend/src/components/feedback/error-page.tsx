import { Button, Card } from "@heroui/react";
import {
	ArrowClockwiseIcon,
	ArrowLeftIcon,
	WarningCircleIcon,
} from "@phosphor-icons/react";
import { Link, useRouter } from "@tanstack/react-router";

interface ErrorPageProps {
	error: Error;
	reset?: () => void;
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
	const router = useRouter();

	const handleTryAgain = () => {
		if (reset) {
			reset();
		} else {
			router.invalidate();
		}
	};

	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md p-8 shadow-large">
				<div className="flex flex-col items-center text-center">
					<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
						<WarningCircleIcon
							weight="duotone"
							className="h-10 w-10 text-danger"
						/>
					</div>

					<h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
						Something went wrong
					</h1>

					<p className="mb-6 text-sm text-default-500">
						We apologize for the inconvenience. An unexpected error has
						occurred.
					</p>

					<div className="mb-8 w-full rounded-lg bg-danger-50/50 p-4 text-left dark:bg-danger/10">
						<p className="font-mono text-sm text-danger-600 dark:text-danger-400 wrap-break-word">
							{error.message || "Unknown error occurred"}
						</p>
					</div>

					<div className="flex w-full flex-col gap-3 sm:flex-row">
						<Button
							variant="outline"
							className="w-full sm:flex-1"
							render={(props) => (
								<Link
									to="/"
									className={props.className}
									children={props.children}
								/>
							)}>
							<ArrowLeftIcon weight="bold" size={18} className="mr-2" />
							Back to home
						</Button>
						<Button
							variant="primary"
							className="w-full sm:flex-1"
							onPress={handleTryAgain}>
							<ArrowClockwiseIcon weight="bold" size={18} className="mr-2" />
							Try again
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
