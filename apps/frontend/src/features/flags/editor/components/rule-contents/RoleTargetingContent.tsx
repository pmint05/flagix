"use client";
import { useState } from "react";
import type { Key } from "@heroui/react";
import { useFormContext } from "react-hook-form";
import {
	Button,
	Input,
	Select,
	TagGroup,
	Tag,
	ListBox,
	ButtonGroup,
} from "@heroui/react";
import { PlusIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../../schema";
import { VariationSelector } from "../VariationSelector";

interface RoleTargetingContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

const COMMON_ROLES = [
	"admin",
	"editor",
	"viewer",
	"member",
	"user",
	"owner",
	"moderator",
];

export function RoleTargetingContent({
	flag,
	ruleIndex,
}: RoleTargetingContentProps) {
	const { watch, setValue } = useFormContext<FlagEditorFormValues>();
	const roles: string[] = watch(`rules.${ruleIndex}.conditions.roles`) ?? [];

	const onRemoveRoles = (keys: Set<Key>) => {
		const newRoles = roles.filter((_, idx) => !keys.has(idx));
		setValue(`rules.${ruleIndex}.conditions.roles`, newRoles, {
			shouldDirty: true,
		});
	};

	const addRole = (role: string) => {
		const trimmed = role.trim().toLowerCase();
		if (trimmed && !roles.includes(trimmed)) {
			setValue(`rules.${ruleIndex}.conditions.roles`, [...roles, trimmed], {
				shouldDirty: true,
			});
		}
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-sm font-medium text-default-700">IF</span>
				<span>user role is one of</span>
			</div>
			<div className="flex items-center gap-2 flex-wrap pl-6">
				<TagGroup selectionMode="none" onRemove={onRemoveRoles}>
					<TagGroup.List
						items={roles.map((role, idx) => ({ id: idx, name: role }))}
						renderEmptyState={() => <span>No roles added</span>}>
						{(item) => (
							<Tag key={item.id} id={item.id} textValue={item.name}>
								{item.name}
							</Tag>
						)}
					</TagGroup.List>
				</TagGroup>
				<AddRoleInput onAdd={addRole} existingRoles={roles} />
			</div>
			<div className="flex items-center gap-2 pl-6">
				<span>then serve</span>
				<VariationSelector
					flag={flag}
					name={`rules.${ruleIndex}.variationId`}
				/>
			</div>
		</div>
	);
}

interface AddRoleInputProps {
	onAdd: (role: string) => void;
	existingRoles: string[];
}

function AddRoleInput({ onAdd, existingRoles }: AddRoleInputProps) {
	const [inputValue, setInputValue] = useState("");

	const handleAdd = () => {
		const trimmed = inputValue.trim().toLowerCase();
		if (trimmed) {
			onAdd(trimmed);
			setInputValue("");
		}
	};

	const availableRoles = COMMON_ROLES.filter((r) => !existingRoles.includes(r));

	return (
		<div className="flex items-center gap-1">
			{availableRoles.length > 0 && (
				<Select
					variant="secondary"
					placeholder="Add role"
					onChange={(k) => {
						if (k) {
							onAdd(k as string);
						}
					}}
					className="w-28">
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							{availableRoles.map((role) => (
								<ListBox.Item key={role} id={role} textValue={role}>
									{role}
								</ListBox.Item>
							))}
						</ListBox>
					</Select.Popover>
				</Select>
			)}
			<ButtonGroup>
				<Input
					aria-label="Role"
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleAdd();
						}
					}}
					placeholder="Or type role"
					className="min-w-24 rounded-r-none"
					variant="secondary"
				/>
				<Button isIconOnly variant="tertiary" onPress={handleAdd}>
					<PlusIcon className="size-3.5" weight="bold" />
				</Button>
			</ButtonGroup>
		</div>
	);
}
