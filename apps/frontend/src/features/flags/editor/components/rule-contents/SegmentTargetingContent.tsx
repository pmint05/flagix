"use client";
import { useState } from "react";
import type { Key } from "@heroui/react";
import { useFormContext, useWatch } from "react-hook-form";
import { TagGroup, Tag, FieldError, Select, ListBox } from "@heroui/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../../schema";
import { VariationSelector } from "../VariationSelector";
import { useHasPermission } from "@/hooks/usePermission";
import { useProjectSegments } from "@/features/flags/api";

interface SegmentTargetingContentProps {
	flag: FeatureFlag;
	ruleIndex: number;
}

export function SegmentTargetingContent({
	flag,
	ruleIndex,
}: SegmentTargetingContentProps) {
	const {
		control,
		setValue,
		formState: { errors },
	} = useFormContext<FlagEditorFormValues>();
	const canEditFlags = useHasPermission("flag:edit");

	const segmentIds =
		useWatch({ name: `rules.${ruleIndex}.conditions.segmentIds`, control }) ??
		[];
	const operator =
		useWatch({ name: `rules.${ruleIndex}.conditions.operator`, control }) ??
		"in";

	const segmentIdsError = (errors?.rules as any)?.[ruleIndex]?.conditions
		?.segmentIds;

	// One-time latch: once the dropdown is opened, keep fetching enabled.
	const [hasFetched, setHasFetched] = useState(false);
	const { data: allSegments = [], isLoading } = useProjectSegments(hasFetched);

	// Remount key resets Select to placeholder after each pick
	const [addSelectKey, setAddSelectKey] = useState(0);

	const onRemoveSegment = (keys: Set<Key>) => {
		const newIds = segmentIds.filter((id: string) => !keys.has(id));
		setValue(`rules.${ruleIndex}.conditions.segmentIds`, newIds, {
			shouldDirty: true,
		});
	};

	const onSelectSegment = (key: string) => {
		if (key && !segmentIds.includes(key)) {
			setValue(
				`rules.${ruleIndex}.conditions.segmentIds`,
				[...segmentIds, key],
				{ shouldDirty: true },
			);
		}
		setAddSelectKey((k) => k + 1);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-sm font-medium text-muted">IF</span>
				<span className="text-sm">user belongs to segment</span>
				<Select
					variant="secondary"
					value={operator}
					onChange={(val) => {
						if (val) {
							setValue(`rules.${ruleIndex}.conditions.operator`, val as any, {
								shouldDirty: true,
							});
						}
					}}
					className="w-32"
					isDisabled={!canEditFlags}>
					<Select.Trigger>
						<Select.Value />
						<Select.Indicator />
					</Select.Trigger>
					<Select.Popover>
						<ListBox>
							<ListBox.Item id="in">IN</ListBox.Item>
							<ListBox.Item id="not_in">NOT IN</ListBox.Item>
						</ListBox>
					</Select.Popover>
				</Select>
			</div>

			<div className="flex flex-col gap-1 pl-6">
				<div className="flex items-center gap-2 flex-wrap">
					<TagGroup
						selectionMode="none"
						onRemove={canEditFlags ? onRemoveSegment : undefined}>
						<TagGroup.List
							items={segmentIds.map((id: string) => {
								const ref = (flag as any).referencedSegments?.[id];
								const found = allSegments.find((s) => s.id === id);
								const name = found?.name ?? ref?.name ?? id;
								return { id, name };
							})}
							renderEmptyState={() => (
								<span className="text-xs text-muted">
									No segments selected
								</span>
							)}>
							{(item) => (
								<Tag key={item.id} id={item.id} textValue={item.name} size="lg">
									{item.name}
								</Tag>
							)}
						</TagGroup.List>
					</TagGroup>

					{canEditFlags && (
						<Select
							key={addSelectKey}
							variant="secondary"
							placeholder={isLoading ? "Loading..." : "Add segment"}
							onOpenChange={(open) => {
								if (open && !hasFetched) setHasFetched(true);
							}}
							onChange={(key) => {
								if (key) onSelectSegment(key as string);
							}}>
							<Select.Trigger>
								<Select.Value />
								<Select.Indicator />
							</Select.Trigger>
							<Select.Popover>
								<ListBox>
									{isLoading ? (
										<ListBox.Item id="__loading" textValue="Loading..." isDisabled>
											Loading...
										</ListBox.Item>
									) : allSegments.filter((seg) => !segmentIds.includes(seg.id))
											.length === 0 ? (
										<ListBox.Item id="__empty" textValue="No segments" isDisabled>
											No segments available
										</ListBox.Item>
									) : (
										allSegments
											.filter((seg) => !segmentIds.includes(seg.id))
											.map((seg) => (
												<ListBox.Item
													id={seg.id}
													key={seg.id}
													textValue={seg.name}>
													{seg.name} ({seg.key})
												</ListBox.Item>
											))
									)}
								</ListBox>
							</Select.Popover>
						</Select>
					)}
				</div>
				{segmentIdsError && (
					<FieldError className="text-xs text-danger">
						{segmentIdsError.message}
					</FieldError>
				)}
			</div>

			<div className="flex items-center gap-2 pl-6">
				<span className="text-sm">then resolve</span>
				<VariationSelector
					flag={flag}
					name={`rules.${ruleIndex}.variationId`}
				/>
			</div>
		</div>
	);
}
