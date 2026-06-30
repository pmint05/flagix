import { createFileRoute } from "@tanstack/react-router";
import { useOrganizations } from "@/features/organizations/api";
import { useContextStore, useIsHydrated } from "@/stores";
import { BuildingIcon } from "@phosphor-icons/react";
import { Skeleton } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import type { Organization } from "@/types";

export const Route = createFileRoute("/orgSelect")({
	component: OrgSelectLayout,
});

function OrgSelectLayout() {
	const { data: organizations, isLoading } = useOrganizations();
	const setOrganization = useContextStore((s) => s.setOrganization);
	const isHydrated = useIsHydrated();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isHydrated) return;
		authClient.getSession().then((session) => {
			if (!session.data?.session) {
				void navigate({ to: "/login", replace: true });
			}
		});
	}, [isHydrated, navigate]);

	const handleSelectOrg = (org: Organization) => {
		setOrganization(org);
		void navigate({ to: "/", replace: true });
	};

	useEffect(() => {
		if (!isHydrated || isLoading || !organizations?.length) return;

		if (organizations.length === 1) {
			handleSelectOrg(organizations[0]);
		}
	}, [isHydrated, isLoading, organizations]);

	if (!isHydrated || isLoading) {
		return <OrgSelectSkeleton />;
	}

	if (!organizations?.length) {
		void navigate({ to: "/noOrg", replace: true });
		return null;
	}

	return (
		<div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
			<div className="w-full max-w-lg space-y-8">
				<div className="text-center space-y-2">
					<div className="flex justify-center mb-4">
						<div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30">
							<BuildingIcon className="h-8 w-8 text-primary" />
						</div>
					</div>
					<h1 className="text-2xl font-bold text-foreground">
						Select Organization
					</h1>
					<p className="text-default-500">
						Choose an organization to continue to your dashboard.
					</p>
				</div>

				<div className="space-y-3">
					{organizations.map((org) => (
						<button
							key={org.id}
							onClick={() => handleSelectOrg(org)}
							className="w-full p-4 rounded-xl border border-default-200 dark:border-default-800 hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left group">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-medium text-foreground group-hover:text-primary">
										{org.name}
									</h3>
									<p className="text-sm text-default-500 capitalize">
										{org.role}
									</p>
								</div>
								<div className="text-default-400 group-hover:text-primary">
									<BuildingIcon className="h-5 w-5" />
								</div>
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

function OrgSelectSkeleton() {
	return (
		<div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
			<div className="w-full max-w-lg space-y-8">
				<div className="text-center space-y-2">
					<Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
					<Skeleton className="h-8 w-48 rounded-md mx-auto" />
					<Skeleton className="h-4 w-64 rounded-md mx-auto mt-2" />
				</div>
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-20 w-full rounded-xl" />
					))}
				</div>
			</div>
		</div>
	);
}
