import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
	Button,
	Form,
	FieldError,
	Label,
	Select,
	SelectTrigger,
	SelectValue,
	SelectPopover,
	SelectIndicator,
	ListBox,
	ListBoxItem,
	Modal,
	toast,
} from "@heroui/react";
import { useCreateRule } from "./api";
import type { Variation } from "@/types/feature-flag";
import type { Environment } from "@/types";

const RULE_TYPES = [
	{ key: "kill_switch", label: "Kill Switch", description: "Disable the flag across all users" },
	{ key: "user", label: "User Targeting", description: "Target specific users by ID or attribute" },
	{ key: "role", label: "Role Targeting", description: "Target users by role" },
	{ key: "percentage", label: "Percentage Rollout", description: "Roll out to a percentage of users" },
] as const;

interface RuleModalProps {
	isOpen: boolean;
	onClose: () => void;
	flagId: string;
	variations: Variation[];
	environments: Environment[];
	defaultEnvironmentId?: string;
}

export function RuleModal({
	isOpen,
	onClose,
	flagId,
	variations,
	environments,
	defaultEnvironmentId,
}: RuleModalProps) {
	const createRule = useCreateRule();

	type RuleFormValues = {
		ruleType: "kill_switch" | "user" | "role" | "percentage";
		environmentId: string;
		variationId: string;
		conditions: Record<string, unknown>;
		isEnabled: boolean;
	};

	const {
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<RuleFormValues>({
		defaultValues: {
			ruleType: "kill_switch",
			environmentId: defaultEnvironmentId ?? "",
			variationId: "",
			conditions: {},
			isEnabled: true,
		},
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				ruleType: "kill_switch",
				environmentId: defaultEnvironmentId ?? "",
				variationId: "",
				conditions: {},
				isEnabled: true,
			});
		}
	}, [isOpen, defaultEnvironmentId, reset]);

	const onSubmit = async (data: RuleFormValues) => {
		try {
			await createRule.mutateAsync({
				...data,
				flagId,
			});
			toast.success("Rule created successfully");
			onClose();
		} catch {
			toast.danger("Failed to create rule");
		}
	};

	return (
		<Modal.Root isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop />
			<Modal.Container>
				<Modal.Dialog>
					<Modal.Header>
						<Modal.Heading>Create Targeting Rule</Modal.Heading>
					</Modal.Header>
					<Modal.Body>
						<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<Controller
								name="ruleType"
								control={control}
								render={({ field }) => (
									<Select
										selectedKey={field.value as string}
										onSelectionChange={(key) => {
											if (key) field.onChange(key);
										}}
									>
										<Label>Rule Type</Label>
										<SelectTrigger>
											<SelectValue />
											<SelectIndicator />
										</SelectTrigger>
										<SelectPopover>
											<ListBox>
												{RULE_TYPES.map((t) => (
													<ListBoxItem id={t.key} key={t.key}>
														{t.label}
													</ListBoxItem>
												))}
											</ListBox>
										</SelectPopover>
										{errors.ruleType && (
											<FieldError>{errors.ruleType.message}</FieldError>
										)}
									</Select>
								)}
							/>

							<Controller
								name="environmentId"
								control={control}
								render={({ field }) => (
									<Select
										selectedKey={field.value as string}
										onSelectionChange={(key) => {
											if (key) field.onChange(key);
										}}
									>
										<Label>Environment</Label>
										<SelectTrigger>
											<SelectValue />
											<SelectIndicator />
										</SelectTrigger>
										<SelectPopover>
											<ListBox>
												{environments.map((env) => (
													<ListBoxItem id={env.id} key={env.id}>
														{env.name}
													</ListBoxItem>
												))}
											</ListBox>
										</SelectPopover>
										{errors.environmentId && (
											<FieldError>{errors.environmentId.message}</FieldError>
										)}
									</Select>
								)}
							/>

							<Controller
								name="variationId"
								control={control}
								render={({ field }) => (
									<Select
										selectedKey={field.value as string}
										onSelectionChange={(key) => {
											if (key) field.onChange(key);
										}}
									>
										<Label>Variation</Label>
										<SelectTrigger>
											<SelectValue />
											<SelectIndicator />
										</SelectTrigger>
										<SelectPopover>
											<ListBox>
												{variations.map((v) => (
													<ListBoxItem id={v.id} key={v.id}>
														{v.key}
													</ListBoxItem>
												))}
											</ListBox>
										</SelectPopover>
										{errors.variationId && (
											<FieldError>{errors.variationId.message}</FieldError>
										)}
									</Select>
								)}
							/>

							<Modal.Footer>
								<Button variant="ghost" onPress={onClose}>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="primary"
									isDisabled={createRule.isPending}
								>
									Create Rule
								</Button>
							</Modal.Footer>
						</Form>
					</Modal.Body>
				</Modal.Dialog>
			</Modal.Container>
		</Modal.Root>
	);
}
