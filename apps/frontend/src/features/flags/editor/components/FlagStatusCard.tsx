"use client";
import {
	Switch,
	ListBox,
	Card,
	Header,
	Autocomplete,
	useFilter,
	SearchField,
	Button,
} from "@heroui/react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { HexagonIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues, Variation } from "../schema";
import { getVariationColorClass } from "@/lib/variation-colors";
import { useHasPermission } from "@/hooks/usePermission";

interface FlagStatusCardProps {
	flag: FeatureFlag;
}

export function FlagStatusCard({ flag: _flag }: FlagStatusCardProps) {
	const { control } = useFormContext<FlagEditorFormValues>();
	const isFlagOn = useWatch({ name: "isFlagOn", control });
	const offVariationId = useWatch({ name: "offVariationId", control });
	const defaultVariationId = useWatch({ name: "defaultVariationId", control });
	const variations = useWatch({ name: "variations", control }) || [];
	const canEditFlags = useHasPermission("flag:edit");

	const defaultVariationName =
		variations.find((v) => v.id === defaultVariationId)?.key ?? "None";

	return (
		<Card className="flex flex-col gap-3 px-4 py-3 rounded-3xl border border-divider min-h-14 mb-0">
			<div className="flex items-center gap-2 flex-wrap">
				<span className="">Flag is</span>
				<Controller
					name="isFlagOn"
					control={control}
					render={({ field }) => (
						<Switch
							isSelected={field.value}
							onChange={field.onChange}
							isDisabled={!canEditFlags}
							className="ml-1">
							<Switch.Content>
								<Switch.Control>
									<Switch.Thumb />
								</Switch.Control>
								<span className="font-medium p-1 rounded-2xl bg-default">
									{field.value ? "On" : "Off"}
								</span>
							</Switch.Content>
						</Switch>
					)}
				/>
				{isFlagOn ? (
					<span className="">resolving variations based on rules</span>
				) : (
					<>
						<span className="">resolving</span>
						<OffVariationSelect variations={variations} />
						<span className="">to all traffic</span>
						{!offVariationId && (
							<span className="text-warning">
								(falling back to default variation in the default rule: {defaultVariationName})
							</span>
						)}
					</>
				)}
			</div>
		</Card>
	);
}

interface OffVariationSelectProps {
	variations: Variation[];
}

function OffVariationSelect({ variations }: OffVariationSelectProps) {
	const { control } = useFormContext<FlagEditorFormValues>();
	const { contains } = useFilter({ sensitivity: "base" });
	const canEditFlags = useHasPermission("flag:edit");

	return (
		<Controller
			name="offVariationId"
			control={control}
			render={({ field }) => (
				<Autocomplete
					variant="secondary"
					placeholder="None"
					value={field.value}
					onChange={(v) => field.onChange(v as string)}
					aria-label="Select off variation"
					isDisabled={!canEditFlags}
					className="w-fit">
					<Autocomplete.Trigger className="min-h-4 py-1 px-1.5">
						<Autocomplete.Value className="truncate max-w-30" />
					</Autocomplete.Trigger>
					<Autocomplete.Popover className={"min-w-48"} placement="bottom">
						<Autocomplete.Filter filter={contains}>
							<SearchField autoFocus name="search" variant="secondary">
								<SearchField.Group>
									<SearchField.SearchIcon />
									<SearchField.Input placeholder="Search states..." />
									<SearchField.ClearButton />
								</SearchField.Group>
							</SearchField>
							<ListBox>
								<ListBox.Section>
									<Header className="flex items-center gap-2 justify-between">
										<p>Off Variations</p>
										<Button
											size="sm"
											variant="ghost"
											className={"min-h-4 h-6 py-0 px-1.5 text-xs rounded-xl"}
											onPress={() => field.onChange("")}>
											Clear
										</Button>
									</Header>
									{variations.map((v) => {
										const keyText = v.key || String(v.value);
										return (
											<ListBox.Item id={v.id} key={v.id} textValue={keyText}>
												<div className="flex items-center gap-2">
													<HexagonIcon
														weight="fill"
														className={`${getVariationColorClass(
															v.color,
															variations.findIndex((x) => x.id === v.id),
														)} size-3.5 shrink-0`}
													/>
													<span className="truncate flex-1 text-left">
														{keyText}
													</span>
												</div>
											</ListBox.Item>
										);
									})}
								</ListBox.Section>
							</ListBox>
						</Autocomplete.Filter>
					</Autocomplete.Popover>
				</Autocomplete>
			)}
		/>
	);
}
