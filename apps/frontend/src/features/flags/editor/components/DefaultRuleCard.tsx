"use client";
import { Controller, useFormContext } from "react-hook-form";
import {
	ListBox,
	Card,
	Autocomplete,
	useFilter,
	SearchField,
} from "@heroui/react";
import { HexagonIcon } from "@phosphor-icons/react";
import type { FeatureFlag } from "@/types/feature-flag";
import type { FlagEditorFormValues } from "../schema";
import { getVariationColor } from "@/lib/variation-colors";

interface DefaultRuleCardProps {
	flag: FeatureFlag;
}

export function DefaultRuleCard({ flag }: DefaultRuleCardProps) {
	const { control, watch } = useFormContext<FlagEditorFormValues>();
	const isFlagOn = watch("isFlagOn");

	return (
		<Card className="border border-divider shadow-sm">
			<h3 className="font-medium text-foreground flex items-center gap-2">
				<span className="font-semibold">Default Rule</span>
			</h3>
			<div className="flex-items-center flex-row gap-2 w-full">
				<span className="inline-block mr-2">
					If none of the above rules match, serve
				</span>
				<Controller
					name="defaultVariationId"
					control={control}
					render={({ field }) => (
						<VariationSelect
							flag={flag}
							value={field.value}
							onChange={field.onChange}
							isDisabled={!isFlagOn}
						/>
					)}
				/>
			</div>
		</Card>
	);
}

interface VariationSelectProps {
	flag: FeatureFlag;
	value: string;
	onChange: (value: string) => void;
	isDisabled?: boolean;
}

function VariationSelect({
	flag,
	value,
	onChange,
	isDisabled,
}: VariationSelectProps) {
	const { contains } = useFilter({ sensitivity: "base" });

	return (
		<Autocomplete
			value={value}
			onChange={(v) => onChange(v as string)}
			className="inline-flex"
			variant="secondary"
			allowsEmptyCollection
			isDisabled={isDisabled}>
			<Autocomplete.Trigger className="min-h-4 py-1 px-1.5">
				<Autocomplete.Value />
			</Autocomplete.Trigger>
			<Autocomplete.Popover className={"min-w-48"} placement="bottom">
				<Autocomplete.Filter filter={contains}>
					<SearchField autoFocus name="search" variant="secondary">
						<SearchField.Group>
							<SearchField.SearchIcon />
							<SearchField.Input placeholder="Search users..." />
							<SearchField.ClearButton />
						</SearchField.Group>
					</SearchField>
					<ListBox>
						{(flag.variations ?? []).map((v, idx) => (
							<ListBox.Item id={v.id} key={v.id} textValue={v.key}>
								<div className="flex items-center gap-2">
									<HexagonIcon
										weight="fill"
										className={`${getVariationColor(idx)} size-3.5`}
									/>
									<span>{v.key}</span>
								</div>
							</ListBox.Item>
						))}
					</ListBox>
				</Autocomplete.Filter>
			</Autocomplete.Popover>
		</Autocomplete>
	);
}
