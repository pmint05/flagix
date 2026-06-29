"use client";
import {
	Switch,
	ListBox,
	Card,
	Header,
	Autocomplete,
	useFilter,
	SearchField,
} from "@heroui/react";
import { Controller, useFormContext } from "react-hook-form";
import { HexagonIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../schema";
import { getVariationColor } from "@/lib/variation-colors";

interface FlagStatusCardProps {
	flag: FeatureFlag;
}

export function FlagStatusCard({ flag }: FlagStatusCardProps) {
	const { control, watch } = useFormContext<FlagEditorFormValues>();
	const isFlagOn = watch("isFlagOn");

	return (
		<Card className="flex flex-row items-center justify-start px-4 py-3 rounded-3xl border border-divider min-h-14 mb-0">
			<div className="flex items-center gap-2">
				<span className="">Flag is</span>
				<Controller
					name="isFlagOn"
					control={control}
					render={({ field }) => (
						<Switch
							isSelected={field.value}
							onChange={field.onChange}
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
					<span className="">serving variations based on rules</span>
				) : (
					<>
						<span className="">serving</span>
						<OffVariationSelect variations={flag.variations ?? []} />
						<span className="">to all traffic</span>
					</>
				)}
			</div>
		</Card>
	);
}

interface OffVariationSelectProps {
	variations: { id: string; key: string; value: unknown }[];
}

function OffVariationSelect({ variations }: OffVariationSelectProps) {
	const { control } = useFormContext<FlagEditorFormValues>();
	const { contains } = useFilter({ sensitivity: "base" });

	return (
		<Controller
			name="offVariationId"
			control={control}
			render={({ field }) => (
				<Autocomplete
					variant="secondary"
					value={field.value}
					onChange={(v) => field.onChange(v)}
					aria-label="Select off variation"
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
									<Header>Off Variations</Header>
									{variations.map((v) => (
										<ListBox.Item id={v.id} textValue={v.key}>
											<div className="flex items-center gap-2">
												<HexagonIcon
													weight="fill"
													className={`${getVariationColor(variations.findIndex((x) => x.id === v.id))} size-3.5 shrink-0`}
												/>
												<span className="truncate flex-1 text-left">
													{v.key}
												</span>
											</div>
										</ListBox.Item>
									))}
								</ListBox.Section>
							</ListBox>
						</Autocomplete.Filter>
					</Autocomplete.Popover>
				</Autocomplete>
			)}
		/>
	);
}
