import {
	HeadContent,
	Scripts,
	createRootRouteWithContext,
} from "@tanstack/react-router";
import { Toast } from "@heroui/react";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { useHydrateStores } from "../stores";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";
import { ErrorPage } from "@/components/feedback/error-page";
import { NotFoundPage } from "@/components/feedback/not-found-page";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Flagix Dashboard",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	errorComponent: ({ error, reset }) => {
		return <ErrorPage error={error} reset={reset} />;
	},
	notFoundComponent: () => {
		return <NotFoundPage />;
	},
	pendingComponent: () => {
		return (
			<div className="flex min-h-screen w-full items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
				<div className="text-foreground">Loading...</div>
			</div>
		);
	},
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	useHydrateStores();

	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body>
				<Toast.Provider placement="bottom" />
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
