import { Button, Card } from "@heroui/react";
import { ArrowLeftIcon, LinkBreakIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";

export function NotFoundPage() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md p-8 shadow-large border-none">
				<div className="flex flex-col items-center text-center">
					<div className="mb-6 flex size-20 items-center justify-center rounded-full bg-accent/10">
						<LinkBreakIcon weight="duotone" className="size-10 text-accent" />
					</div>

					<h1 className="mb-2 text-4xl font-extrabold tracking-tight text-foreground">
						404
					</h1>
					<h2 className="mb-4 text-xl font-semibold text-foreground">
						Page not found
					</h2>

					<p className="mb-8 text-foreground">
						Sorry, we couldn't find the page you're looking for. It might have
						been removed, had its name changed, or is temporarily unavailable.
					</p>

					<Button
						variant="primary"
						className="w-full font-medium"
						render={(props) => (
							<Link to="/" className={props.className}>
								<ArrowLeftIcon weight="bold" className="size-5 mr-2" />
								Back to home page
							</Link>
						)}
					/>
				</div>
			</Card>
		</div>
	);
}
