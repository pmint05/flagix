import { Switch } from "@heroui/react";
import { useUpdateFlagState } from "./api";

interface FlagToggleProps {
	flagId: string;
	isEnabled: boolean;
}

export function FlagToggle({ flagId, isEnabled }: FlagToggleProps) {
	const updateFlagState = useUpdateFlagState();

	const handleChange = () => {
		updateFlagState.mutate({
			flagId,
			isEnabled: !isEnabled,
		});
	};

	return (
		<Switch
			isSelected={isEnabled}
			onChange={handleChange}
			size="sm"
		/>
	);
}
