import { create } from "zustand";
import { getPresets } from "../components/simulation/constants";

export interface SimulationState {
	jsonValue: string;
	jsonError: string | null;
	simulationResult: any | null;
	simulationOptions: {
		bypassDraft: boolean;
	};
}

interface SimulationStore {
	statesByFlagId: Record<string, SimulationState>;
	setSimulationState: (flagId: string, state: Partial<SimulationState>) => void;
}

export const DEFAULT_SIMULATION_STATE = (flagKey?: string): SimulationState => ({
	jsonValue: flagKey ? getPresets(flagKey)[0].value : JSON.stringify({ flagKey: "", context: {} }, null, 2),
	jsonError: null,
	simulationResult: null,
	simulationOptions: {
		bypassDraft: true,
	},
});

export const useSimulationStore = create<SimulationStore>((set) => ({
	statesByFlagId: {},
	setSimulationState: (flagId, state) => {
		set((s) => {
			const currentState = s.statesByFlagId[flagId] || DEFAULT_SIMULATION_STATE();
			
			// Deep merge for simulationOptions to avoid overwriting nested properties
			const newOptions = state.simulationOptions
				? { ...currentState.simulationOptions, ...state.simulationOptions }
				: currentState.simulationOptions;

			return {
				statesByFlagId: {
					...s.statesByFlagId,
					[flagId]: {
						...currentState,
						...state,
						simulationOptions: newOptions,
					} as SimulationState,
				},
			};
		});
	},
}));
