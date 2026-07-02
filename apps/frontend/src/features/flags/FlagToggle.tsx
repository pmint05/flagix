import { useUpdateFlagState } from "./api";
import { AsyncSwitch } from "#/components/ui/async-switch";
import { useHasPermission } from "@/hooks/usePermission";

interface FlagToggleProps {
	flagId: string;
	isEnabled: boolean;
}

export function FlagToggle({ flagId, isEnabled }: FlagToggleProps) {
	const updateFlagState = useUpdateFlagState();
	const canToggle = useHasPermission("flag:toggle");

	const handleChange = async () => {
		await updateFlagState.mutateAsync({
			flagId,
			isEnabled: !isEnabled,
		});
	};

	return (
		<AsyncSwitch
			action={handleChange}
			showToast
			isSelected={isEnabled}
			isDisabled={!canToggle}
		/>
	);
}
