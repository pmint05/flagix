import { useEffect, useState, useRef } from "react";
import { TextField, Label, Input, FieldError } from "@heroui/react";
import { slugify } from "#/lib/utils";
import { z } from "zod";

// Reusable validation schema for slug/key inputs
export const slugValidation = z
	.string()
	.min(1, "Key is required")
	.max(100)
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
		"Key must contain only lowercase letters, numbers, and single hyphens '-', and cannot start, end or contain consecutive hyphens",
	);

interface SlugInputProps {
	value: string;
	onChange: (val: string) => void;
	onBlur?: () => void;
	nameValue?: string;
	error?: string;
	label?: string;
	placeholder?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	autoFocus?: boolean;
}

export function SlugInput({
	value,
	onChange,
	onBlur,
	nameValue,
	error,
	label = "Key (Slug)",
	placeholder = "slug-value",
	isDisabled,
	isRequired,
	autoFocus,
}: SlugInputProps) {
	const [isManuallyEdited, setIsManuallyEdited] = useState(!!value);
	const prevNameRef = useRef(nameValue);

	useEffect(() => {
		if (value === "" && (!nameValue || nameValue === "")) {
			setIsManuallyEdited(false);
		}
	}, [value, nameValue]);

	useEffect(() => {
		if (
			!isManuallyEdited &&
			nameValue !== undefined &&
			nameValue !== prevNameRef.current
		) {
			onChange(slugify(nameValue));
		}
		prevNameRef.current = nameValue;
	}, [nameValue, isManuallyEdited, onChange]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIsManuallyEdited(true);
		const rawVal = e.target.value;

		let sanitized = rawVal.replace(/\s+/g, "-").toLowerCase();
		sanitized = sanitized.replace(/[^a-z0-9-]/g, "");
		sanitized = sanitized.replace(/^-+/g, "");
		sanitized = sanitized.replace(/-+/g, "-");

		onChange(sanitized);
	};

	return (
		<TextField
			variant="secondary"
			isInvalid={!!error}
			isDisabled={isDisabled}
			isRequired={isRequired}
			autoFocus={autoFocus}
			className="w-full text-left">
			<Label>{label}</Label>
			<Input
				value={value}
				onChange={handleInputChange}
				onBlur={onBlur}
				placeholder={placeholder}
			/>
			{error && <FieldError>{error}</FieldError>}
		</TextField>
	);
}
