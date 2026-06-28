import { createFileRoute } from "@tanstack/react-router";
import { useCreateOrganization } from "@/features/organizations/api";
import { useContextStore, useIsHydrated } from "@/stores";
import { BuildingIcon } from "@phosphor-icons/react";
import { Button, Form, FieldError, TextField, InputGroup } from "@heroui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { Spinner } from "@heroui/react";
import { Label } from "@heroui/react";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

const createOrgSchema = z.object({
	name: z.string().min(1, "Organization name is required").max(255),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

export const Route = createFileRoute("/noOrg")({
	component: NoOrgLayout,
});

function NoOrgLayout() {
	const isHydrated = useIsHydrated();
	const setOrganization = useContextStore((s) => s.setOrganization);
	const navigate = useNavigate();

	useEffect(() => {
		if (!isHydrated) return;
		authClient.getSession().then((session) => {
			if (!session.data?.session) {
				void navigate({ to: "/login", replace: true });
			}
		});
	}, [isHydrated, navigate]);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateOrgForm>({
		resolver: zodResolver(createOrgSchema),
	});

	const createOrg = useCreateOrganization();

	const onSubmit = async (data: CreateOrgForm) => {
		try {
			const org = await createOrg.mutateAsync(data);
			setOrganization(org);
			void navigate({ to: "/", replace: true });
		} catch {
			// Error handled by mutation
		}
	};

	if (!isHydrated) {
		return (
			<div className="min-h-screen w-full bg-background flex items-center justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full bg-background flex items-center justify-center p-6">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center space-y-2">
					<div className="flex justify-center mb-4">
						<div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30">
							<BuildingIcon className="h-8 w-8 text-primary" />
						</div>
					</div>
					<h1 className="text-2xl font-bold text-foreground">
						Create Your Organization
					</h1>
					<p className="text-default-500">
						You don&apos;t have any organizations yet. Create one to get
						started.
					</p>
				</div>

				<Form
					onSubmit={handleSubmit(onSubmit)}
					validationBehavior="aria"
					className="space-y-4">
					<TextField
						isInvalid={!!errors.name}
						variant="secondary"
						className="w-full">
						<Label>Organization Name</Label>
						<InputGroup variant="secondary">
							<InputGroup.Prefix>
								<BuildingIcon size={18} weight="bold" />
							</InputGroup.Prefix>
							<InputGroup.Input
								{...register("name")}
								placeholder="My Organization"
								className="w-full"
							/>
						</InputGroup>
						{errors.name && <FieldError>{errors.name.message}</FieldError>}
					</TextField>

					<Button
						type="submit"
						variant="primary"
						className="w-full font-medium"
						isDisabled={createOrg.isPending}>
						{createOrg.isPending ? (
							<Spinner size="sm" />
						) : (
							"Create Organization"
						)}
					</Button>
				</Form>
			</div>
		</div>
	);
}
