"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { FeatureFlag, Variation } from "@/types/feature-flag";
import type { TargetingRule } from "@/types/targeting-rule";
import { useRules } from "@/features/rules/api";
import { useContextStore } from "@/stores";

interface FlagEditorContextType {
	flag: FeatureFlag;
	draftVariations: Variation[];
	setDraftVariations: (v: Variation[]) => void;
	
	isFlagOn: boolean;
	setIsFlagOn: (on: boolean) => void;
	
	draftRules: TargetingRule[];
	setDraftRules: (r: TargetingRule[]) => void;
	
	defaultVariationId: string;
	setDefaultVariationId: (id: string) => void;
	
	offVariationId: string;
	setOffVariationId: (id: string) => void;
	
	isDirty: boolean;
	resetDraft: () => void;
}

const FlagEditorContext = createContext<FlagEditorContextType | undefined>(undefined);

export function FlagEditorProvider({ 
	flag, 
	children 
}: { 
	flag: FeatureFlag; 
	children: ReactNode 
}) {
	const currentEnv = useContextStore((s) => s.selectedEnvironment);
	const { data: rulesData } = useRules(flag.id, currentEnv?.id);
	
	const [draftVariations, setDraftVariations] = useState<Variation[]>([]);
	const [isFlagOn, setIsFlagOn] = useState(true);
	const [draftRules, setDraftRules] = useState<TargetingRule[]>([]);
	const [defaultVariationId, setDefaultVariationId] = useState<string>("");
	const [offVariationId, setOffVariationId] = useState<string>("");
	
	const resetDraft = useCallback(() => {
		setDraftVariations(flag.variations || []);
		
		const flagState = flag.states?.find(s => s.environmentId === currentEnv?.id);
		setIsFlagOn(flagState?.isEnabled ?? false);
		
		if (rulesData && currentEnv) {
			const envRules = rulesData.filter((r) => r.environmentId === currentEnv.id);
			setDraftRules(envRules.sort((a, b) => Number.parseInt(a.priority) - Number.parseInt(b.priority)));
		} else {
			setDraftRules([]);
		}
		
		if (flagState) {
			setDefaultVariationId(flagState.defaultVariationId ?? flag.variations?.find((v) => v.isDefault)?.id ?? "");
			setOffVariationId(flagState.offVariationId ?? "");
		} else {
			setDefaultVariationId(flag.variations?.find((v) => v.isDefault)?.id ?? "");
			setOffVariationId("");
		}
	}, [flag, rulesData, currentEnv]);
	
	useEffect(() => {
		resetDraft();
	}, [resetDraft]);
	
	// A simple dirty check
	const isDirty = true; // In a real app we'd deep compare draft vs original

	return (
		<FlagEditorContext.Provider 
			value={{
				flag,
				draftVariations,
				setDraftVariations,
				isFlagOn,
				setIsFlagOn,
				draftRules,
				setDraftRules,
				defaultVariationId,
				setDefaultVariationId,
				offVariationId,
				setOffVariationId,
				isDirty,
				resetDraft
			}}
		>
			{children}
		</FlagEditorContext.Provider>
	);
}

export function useFlagEditorContext() {
	const ctx = useContext(FlagEditorContext);
	if (!ctx) throw new Error("useFlagEditorContext must be used within FlagEditorProvider");
	return ctx;
}
