"use client";
import { Controller, useFormContext } from "react-hook-form";
import {
	Select,
	ListBox,
	Autocomplete,
	useFilter,
	SearchField,
	cn,
} from "@heroui/react";
import type { FeatureFlag } from "@/types/feature-flag";
import { VariationDot } from "@/components/ui/VariationDot";

interface VariationSelectorProps {
	flag: FeatureFlag;
	name?: string; // React Hook Form field name (e.g. `rules.${ruleIndex}.variationId`)
	value?: string; // Standard controlled value
	onChange?: (value: string) => void; // Standard controlled change handler
	className?: string;
}

export function VariationSelector({
	flag,
	name,
	value,
	onChange,
	className = "w-40",
}: VariationSelectorProps) {
	const formContext = useFormContext(); // optional, only if name is passed
	const { contains } = useFilter({ sensitivity: "base" });
	const renderSelect = (val: string, onValChange: (v: string) => void) => (
		<Autocomplete
			variant="secondary"
			value={val}
			onChange={(v) => onValChange(v as string)}
			className={cn("w-fit", className)}>
			<Autocomplete.Trigger className="min-h-4 py-1 px-1.5">
				<Autocomplete.Value />
			</Autocomplete.Trigger>
			<Autocomplete.Popover className={"min-w-48"} placement="bottom">
				<Autocomplete.Filter filter={contains}>
					<SearchField autoFocus name="search" variant="secondary">
						<SearchField.Group>
							<SearchField.SearchIcon />
							<SearchField.Input placeholder="Search variations..." />
							<SearchField.ClearButton />
						</SearchField.Group>
					</SearchField>
					<ListBox>
						{(flag.variations ?? []).map((v: any, idx: number) => (
							<ListBox.Item id={v.id} key={v.id} textValue={v.key}>
								<div className="flex items-center gap-2">
									<VariationDot index={idx} className="size-3.5" />
									<span>{v.key}</span>
								</div>
							</ListBox.Item>
						))}
					</ListBox>
				</Autocomplete.Filter>
			</Autocomplete.Popover>
		</Autocomplete>
	);

	if (name && formContext?.control) {
		return (
			<Controller
				name={name}
				control={formContext.control}
				render={({ field }) => renderSelect(field.value, field.onChange)}
			/>
		);
	}

	return renderSelect(value ?? "", onChange ?? (() => {}));
}
