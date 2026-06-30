import { useUpdateFlagState } from "./api";
import { AsyncSwitch } from "#/components/ui/async-switch";

interface FlagToggleProps {
	flagId: string;
	isEnabled: boolean;
}

export function FlagToggle({ flagId, isEnabled }: FlagToggleProps) {
	const updateFlagState = useUpdateFlagState();

	const handleChange = async () => {
		await updateFlagState.mutateAsync({
			flagId,
			isEnabled: !isEnabled,
		});
	};

	return <AsyncSwitch action={handleChange} showToast isSelected={isEnabled} />;
}
