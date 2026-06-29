"use client";
import { useState } from "react";
import type { Key } from "@heroui/react";
import { useFormContext } from "react-hook-form";
import {
	Button,
	Input,
	TagGroup,
	Tag,
	ButtonGroup,
	FieldError,
} from "@heroui/react";
import { PlusIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../../schema";
import { VariationSelector } from "../VariationSelector";

interface UserTargetingContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

export function UserTargetingContent({
	flag,
	ruleIndex,
}: UserTargetingContentProps) {
	const { watch, setValue, formState: { errors } } = useFormContext<FlagEditorFormValues>();
	const userIds: string[] =
		watch(`rules.${ruleIndex}.conditions.userIds`) ?? [];
	const userIdsError = (errors?.rules as any)?.[ruleIndex]?.conditions?.userIds;

	const onRemoveUserIds = (keys: Set<Key>) => {
		const newIds = userIds.filter((_, idx) => !keys.has(idx));
		setValue(`rules.${ruleIndex}.conditions.userIds`, newIds, {
			shouldDirty: true,
		});
	};

	const addUserId = (userId: string) => {
		const trimmed = userId.trim();
		if (trimmed && !userIds.includes(trimmed)) {
			setValue(`rules.${ruleIndex}.conditions.userIds`, [...userIds, trimmed], {
				shouldDirty: true,
			});
		}
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-sm font-medium text-default-700">IF</span>
				<span className="text-sm text-default-600">user ID is one of</span>
			</div>
			<div className="flex flex-col gap-1 pl-6">
				<div className="flex items-center gap-2 flex-wrap">
					<TagGroup selectionMode="single" onRemove={onRemoveUserIds}>
						<TagGroup.List
							items={userIds.map((id, idx) => ({ id: idx, name: id }))}
							renderEmptyState={() => <span>No users added</span>}>
							{(item) => (
								<Tag key={item.id} id={item.id} textValue={item.name} size="lg">
									{item.name}
								</Tag>
							)}
						</TagGroup.List>
					</TagGroup>
					<AddUserIdInput onAdd={addUserId} />
				</div>
				{userIdsError && (
					<FieldError className="text-xs text-danger">
						{userIdsError.message}
					</FieldError>
				)}
			</div>
			<div className="flex items-center gap-2 pl-6">
				<span className="text-sm text-default-600">then resolve</span>
				<VariationSelector
					flag={flag}
					name={`rules.${ruleIndex}.variationId`}
				/>
			</div>
		</div>
	);
}

interface AddUserIdInputProps {
	onAdd: (userId: string) => void;
}

function AddUserIdInput({ onAdd }: AddUserIdInputProps) {
	const [inputValue, setInputValue] = useState("");

	const handleAdd = () => {
		const trimmed = inputValue.trim();
		if (trimmed) {
			onAdd(trimmed);
			setInputValue("");
		}
	};

	return (
		<div className="flex items-center gap-1">
			<ButtonGroup>
				<Input
					variant="secondary"
					aria-label="Add user ID"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleAdd();
						}
					}}
					placeholder="Add user ID"
					className="w-32 rounded-r-none"
				/>
				<Button isIconOnly variant="tertiary" onPress={handleAdd}>
					<PlusIcon className="size-3.5" weight="bold" />
				</Button>
			</ButtonGroup>
		</div>
	);
}
