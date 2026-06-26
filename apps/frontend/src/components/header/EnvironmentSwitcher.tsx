import {
	Dropdown,
	Button,
	ButtonGroup,
	Label,
	Description,
} from "@heroui/react";
import { CaretDownIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { useContextStore } from "#/stores";
import { useEnvironments } from "#/features/environments/api";
import { generateColorFromString } from "#/lib/color-from-string";
import { EnvironmentActions } from "./EnvironmentActions";

export function EnvironmentSwitcher() {
	const { selectedProject, selectedEnvironment, setEnvironment } =
		useContextStore();
	const { data: environments, isLoading } = useEnvironments();

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

	if (!environments || environments.length === 0) {
		return (
			<Button variant="secondary" size="sm">
				Create Environment
				<PlusIcon size={16} />
			</Button>
		);
	}

	return (
		<ButtonGroup variant="outline" size="sm">
			<Dropdown>
				<Dropdown.Trigger
					render={() => (
						<Button className="flex items-center gap-2 px-3" size="sm">
							{selectedEnvironment ? (
								<>
									<div
										className="h-2 w-2 rounded-full"
										style={{
											backgroundColor: generateColorFromString(
												selectedEnvironment.slug,
											),
										}}
									/>
									<span className="font-medium">
										{selectedEnvironment.name}
									</span>
								</>
							) : isLoading ? (
								<span>Loading...</span>
							) : (
								<span>Select Environment</span>
							)}
							<CaretDownIcon size={14} className="ml-1" />
						</Button>
					)}
				/>
				<Dropdown.Popover placement="bottom end">
					<Dropdown.Menu aria-label="Select Environment" className="w-56">
						{environments?.map((env) => (
							<Dropdown.Item
								id={env.id}
								onPress={() => setEnvironment(env)}
								textValue={env.name}>
								<div className="flex w-full items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className="h-2 w-2 rounded-full"
											style={{
												backgroundColor: generateColorFromString(env.slug),
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
						)) || []}
					</Dropdown.Menu>
				</Dropdown.Popover>
			</Dropdown>
			<EnvironmentActions />
		</ButtonGroup>
	);
}
