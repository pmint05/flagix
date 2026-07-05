import { useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { z } from "zod";
import {
	Button,
	Form,
	FieldError,
	Label,
	TextField,
	Input,
	TextArea,
	Modal,
	toast,
} from "@heroui/react";
import { useCreateSegment } from "@/features/flags/api";
import { useUIStore } from "@/stores";
import { ActionButton } from "#/components/ui/action-button";
import { SlugInput, slugValidation } from "#/components/ui/slug-input";

const segmentFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	key: slugValidation,
	description: z.string().optional(),
});

type SegmentFormData = z.infer<typeof segmentFormSchema>;

export function CreateSegmentModal() {
	const { projectSlug } = useParams({ strict: false });
	const navigate = useNavigate();
	const createSegment = useCreateSegment();
	const { isCreateSegmentOpen, closeCreateSegment } = useUIStore();

	const {
		handleSubmit,
		setValue,
		control,
		reset,
		watch,
		formState: { errors },
	} = useForm<SegmentFormData>({
		resolver: standardSchemaResolver(segmentFormSchema),
		defaultValues: {
			name: "",
			key: "",
			description: "",
		},
	});

	const watchedName = watch("name");

	// Reset form state when drawer opens
	useEffect(() => {
		if (isCreateSegmentOpen) {
			reset({
				name: "",
				key: "",
				description: "",
			});
		}
	}, [isCreateSegmentOpen, reset]);

	const onSubmit = async (data: SegmentFormData) => {
		try {
			const payload = { ...data, conditions: [] };
			const newSeg = await createSegment.mutateAsync(payload);
			
			toast.success("Segment created successfully");
			closeCreateSegment();
			
			void navigate({
				to: "/projects/$projectSlug/segments/$segmentSlug",
				params: { projectSlug: projectSlug!, segmentSlug: newSeg.key },
			});
		} catch (error) {
			toast.danger("Failed to create segment", {
				description: (error as Error).message,
			});
		}
	};

	return (
		<Modal isOpen={isCreateSegmentOpen} onOpenChange={(open) => !open && closeCreateSegment()}>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog>
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Create Segment</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<Controller
									name="name"
									control={control}
									render={({ field }) => (
										<TextField
											autoFocus
											isInvalid={!!errors.name}
											variant="secondary"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}>
											<Label>Name</Label>
											<Input placeholder="Beta Users" />
											{errors.name && (
												<FieldError>{errors.name.message}</FieldError>
											)}
										</TextField>
									)}
								/>

								<Controller
									name="key"
									control={control}
									render={({ field }) => (
										<SlugInput
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											nameValue={watchedName}
											error={errors.key?.message}
											label="Key (Slug)"
											placeholder="beta-users"
										/>
									)}
								/>

								<Controller
									name="description"
									control={control}
									render={({ field }) => (
										<TextField
											isInvalid={!!errors.description}
											variant="secondary"
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}>
											<Label>Description</Label>
											<TextArea
												placeholder="Users scoped for beta-testing new features"
												rows={3}
											/>
											{errors.description && (
												<FieldError>{errors.description.message}</FieldError>
											)}
										</TextField>
									)}
								/>

								<Modal.Footer>
									<Button variant="ghost" onPress={closeCreateSegment}>
										Cancel
									</Button>
									<ActionButton
										type="submit"
										variant="primary"
										isDisabled={createSegment.isPending}
										isPending={createSegment.isPending}>
										Create
									</ActionButton>
								</Modal.Footer>
							</Form>
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
