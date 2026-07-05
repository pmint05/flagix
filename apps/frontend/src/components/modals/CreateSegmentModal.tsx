import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Input, TextArea, TextField, Label } from "@heroui/react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useCreateSegment } from "@/features/flags/api";
import { useUIStore } from "@/stores";

export function CreateSegmentModal() {
	const { projectSlug } = useParams({ strict: false });
	const navigate = useNavigate();
	const createSegment = useCreateSegment();
	const { isCreateSegmentOpen, closeCreateSegment } = useUIStore();

	const [name, setName] = useState("");
	const [key, setKey] = useState("");
	const [description, setDescription] = useState("");

	useEffect(() => {
		if (isCreateSegmentOpen) {
			setName("");
			setKey("");
			setDescription("");
		}
	}, [isCreateSegmentOpen]);

	const handleSave = async () => {
		const payload = { key, name, description, conditions: [] };
		const newSeg = await createSegment.mutateAsync(payload);
		closeCreateSegment();
		navigate({
			to: "/projects/$projectSlug/segments/$segmentSlug",
			params: { projectSlug: projectSlug!, segmentSlug: newSeg.key },
		});
	};

	return (
		<ConfirmModal
			isOpen={isCreateSegmentOpen}
			onCancel={closeCreateSegment}
			onConfirm={handleSave}
			title="Create Segment"
			confirmText="Create"
			description="">
			<div className="space-y-4 pt-2 text-left">
				<div className="grid grid-cols-2 gap-4">
					<TextField variant="secondary">
						<Label>Name</Label>
						<Input
							placeholder="Beta Users"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</TextField>
					<TextField variant="secondary">
						<Label>Key (Slug)</Label>
						<Input
							placeholder="beta-users"
							value={key}
							onChange={(e) => setKey(e.target.value)}
						/>
					</TextField>
				</div>
				<TextField variant="secondary">
					<Label>Description</Label>
					<TextArea
						placeholder="Users scoped for beta-testing new features"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={2}
					/>
				</TextField>
			</div>
		</ConfirmModal>
	);
}
