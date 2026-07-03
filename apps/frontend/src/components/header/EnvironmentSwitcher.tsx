import {
	Dropdown,
	Button,
	ButtonGroup,
	Label,
	Description,
	Skeleton,
} from "@heroui/react";
import {
	ArrowsLeftRightIcon,
	CaretDownIcon,
	CheckIcon,
	PlusIcon,
} from "@phosphor-icons/react";
import { useContextStore } from "#/stores";
import { useEnvironments } from "#/features/environments/api";
import { generateColorFromString } from "#/lib/color-from-string";
import { EnvironmentActions } from "./EnvironmentActions";
import { EnvironmentModal } from "#/features/environments/EnvironmentModal";
import { useState, useEffect } from "react";
import type { Environment } from "#/types/environment";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useHasPermission } from "@/hooks/usePermission";

export function EnvironmentSwitcher() {
	const { selectedProject, selectedEnvironment, setEnvironment } =
		useContextStore();
	const { data: environments, isLoading, isPending } = useEnvironments();
	const [modalOpen, setModalOpen] = useState(false);
	const [editingEnvironment, setEditingEnvironment] = useState<
		Environment | undefined
	>();
	const canCreateEnv = useHasPermission("environment:create");

	const search: any = useSearch({ strict: false });
	const navigate = useNavigate();

	// Sync between URL envSlug and local context
	useEffect(() => {
		if (isPending || isLoading || !environments || environments.length === 0)
			return;

		const urlSlug = search.env;
		const isCurrentEnvValid = selectedEnvironment && environments.some((e) => e.id === selectedEnvironment.id);
		const fallbackEnv = isCurrentEnvValid ? selectedEnvironment! : environments[0];

		if (urlSlug) {
			const matchedEnv = environments.find((e) => e.slug === urlSlug);
			if (matchedEnv && matchedEnv.id !== selectedEnvironment?.id) {
				setEnvironment(matchedEnv);
			} else if (!matchedEnv) {
				setEnvironment(fallbackEnv);
				navigate({
					to: ".",
					search: (prev: any) => ({ ...prev, env: fallbackEnv.slug }),
					replace: true,
				});
			}
		} else {
			if (selectedEnvironment?.id !== fallbackEnv.id) {
				setEnvironment(fallbackEnv);
			}
			navigate({
				to: ".",
				search: (prev: any) => ({ ...prev, env: fallbackEnv.slug }),
				replace: true,
			});
		}
	}, [
		search.env,
		environments,
		selectedEnvironment,
		isPending,
		isLoading,
		setEnvironment,
		navigate,
	]);

	const handleOpenCreate = () => {
		setEditingEnvironment(undefined);
		setModalOpen(true);
	};

	const handleOpenEdit = (env: Environment) => {
		setEditingEnvironment(env);
		setModalOpen(true);
	};

	if (!selectedProject) {
		return (
			<ButtonGroup variant="outline" size="sm">
				<Button isDisabled>No project</Button>
				<Button isDisabled isIconOnly aria-label="Disabled environment actions">
					<CaretDownIcon size={16} />
				</Button>
			</ButtonGroup>
		);
	}

	if (isPending || isLoading) {
		return <Skeleton className="h-8 w-48 rounded" />;
	}

	if (!environments || environments.length === 0) {
		return (
			<>
				<Button variant="secondary" size="sm" onPress={handleOpenCreate} isDisabled={!canCreateEnv}>
					Create Environment
					<PlusIcon size={16} />
				</Button>
				<EnvironmentModal
					isOpen={modalOpen}
					onClose={() => setModalOpen(false)}
					environment={editingEnvironment}
				/>
			</>
		);
	}

	const handleEnvironmentSelect = (env: Environment) => {
		setEnvironment(env);
		navigate({
			to: ".",
			search: (prev: any) => ({ ...prev, env: env.slug }),
			replace: true,
		});
	};

	return (
		<>
			<ButtonGroup variant="outline" size="sm">
				<Button
					variant="secondary"
					className="cursor-auto hover:bg-default select-auto">
					{selectedEnvironment ? (
						<>
							<div
								className="size-3 rounded-full"
								style={{
									backgroundColor: generateColorFromString(
										selectedEnvironment.slug,
									),
								}}
							/>
							<span className="font-medium">{selectedEnvironment.name}</span>
						</>
					) : (
						<span>Select Environment</span>
					)}
				</Button>
				<EnvironmentActions
					onOpenCreate={handleOpenCreate}
					onOpenEdit={handleOpenEdit}
				/>
				<Dropdown>
					<Dropdown.Trigger
						render={({ ref }) => (
							<Button
								ref={ref}
								className="flex items-center gap-2 px-3"
								size="sm"
								variant="secondary"
								isIconOnly>
								<ButtonGroup.Separator />
								<ArrowsLeftRightIcon size={14} />
							</Button>
						)}
					/>
					<Dropdown.Popover placement="bottom end">
						<Dropdown.Menu aria-label="Select Environment" className="w-56">
							{environments?.length === 0 ? (
								<Dropdown.Item isDisabled>No environments</Dropdown.Item>
							) : (
								environments
									?.filter((env) => env.isActive)
									.map((env) => (
										<Dropdown.Item
											id={env.id}
											key={env.id}
											onPress={() => handleEnvironmentSelect(env)}
											textValue={env.name}>
											<div className="flex w-full items-center justify-between">
												<div className="flex items-baseline gap-2">
													<div
														className="size-3 top-0.5 rounded-full relative"
														style={{
															backgroundColor: generateColorFromString(
																env.slug,
															),
														}}
													/>
													<div className="flex flex-col">
														<Label>{env.name}</Label>
														<Description>{env.type}</Description>
													</div>
												</div>
												{selectedEnvironment?.id === env.id && (
													<CheckIcon size={16} />
												)}
											</div>
										</Dropdown.Item>
									)) || []
							)}
						</Dropdown.Menu>
					</Dropdown.Popover>
				</Dropdown>
			</ButtonGroup>
			<EnvironmentModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				environment={editingEnvironment}
			/>
		</>
	);
}
