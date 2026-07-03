import { Outlet, createFileRoute } from "@tanstack/react-router";
import { FlagBannerFoldIcon } from "@phosphor-icons/react";

export const Route = createFileRoute("/_auth")({
	component: AuthLayout,
});

function AuthLayout() {
	return (
		<div className="flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 sm:px-6 lg:px-8 relative">
			<div className="relative z-10 w-full max-w-md space-y-8">
				<div className="text-center">
					<div className="mx-auto flex items-center	gap-2 justify-center rounded-full bg-primary/10">
						<FlagBannerFoldIcon
							size={32}
							weight="fill"
							className="h-8 w-8 text-primary"
						/>
						<h1 className="text-2xl font-extrabold tracking-tight text-foreground">
							Flagix
						</h1>
					</div>
					<p className="mt-2 text-sm">
						Master your feature flags with precision
					</p>
				</div>
				<Outlet />
			</div>
		</div>
	);
}
