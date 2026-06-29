import { getRouteApi } from "@tanstack/react-router";
import { Tabs, toast, Button, Separator } from "@heroui/react";
import type { FeatureFlag } from "@/types/feature-flag";
import { TargetingTab } from "./TargetingTab";
import { VariationsTab } from "./VariationsTab";
import { PreviewTab } from "./PreviewTab";
import { MonitoringTab } from "./MonitoringTab";
import { FlagEditorProvider } from "./FlagEditorContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { flagEditorFormSchema, type FlagEditorFormValues } from "./schema";
import CopyButton from "#/components/ui/copy-button";
import { useContextStore } from "#/stores";

const routeApi = getRouteApi(
	"/_authenticated/projects/$projectSlug/flags/$flagSlug",
);

function EditorContent({ flag }: FlagEditorLayoutProps) {
	const currentEnv = useContextStore((s) => s.selectedEnvironment);
	const search = routeApi.useSearch();
	const navigate = routeApi.useNavigate();
	const isMobile = useIsMobile();

	const activeTab = search.tab ?? "targeting";

	const setActiveTab = (key: string) => {
		navigate({
			search: (prev: any) => ({ ...prev, tab: key as any }),
			replace: true,
		});
	};

	const defaultFlagState = flag.states?.find(
		(s) => s.environmentId === currentEnv?.id,
	);

	const methods = useForm<FlagEditorFormValues>({
		resolver: zodResolver(flagEditorFormSchema),
		defaultValues: {
			isFlagOn: defaultFlagState?.isEnabled ?? false,
			offVariationId: flag.variations?.[flag.variations.length - 1]?.id ?? "",
			defaultVariationId: flag.variations?.[0]?.id ?? "",
			rules: [],
			variations: flag.variations || [],
		},
	});

	const {
		handleSubmit,
		formState: { isDirty: isFormDirty },
	} = methods;

	const handleSave = handleSubmit((data) => {
		console.log("Saving data:", data);
		toast.success("Flag configuration saved successfully");
		// In a real app we'd dispatch multiple mutations here
	});

	const handleDiscard = () => {
		if (isFormDirty) {
			methods.reset();
			toast("Changes discarded");
		} else {
			navigate({
				to: "..",
				replace: true,
			});
		}
	};

	return (
		<FormProvider {...methods}>
			<div className="flex flex-col">
				{/* Sticky Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div>
							<div className="flex items-center gap-3">
								<h1 className="text-xl font-bold text-foreground">
									{flag.name}
								</h1>
							</div>
							<div className="mt-1 flex items-center gap-2 text-sm text-default-500">
								<code className="rounded bg-default-100 px-1 py-0.5">
									{flag.key}
								</code>
								<CopyButton
									text={flag.key}
									buttonProps={{ className: "size-8", isIconOnly: true }}
								/>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" onPress={handleDiscard}>
							Discard
						</Button>
						<Button
							variant="primary"
							onPress={handleSave as any}
							isDisabled={!isFormDirty}>
							Save Changes
						</Button>
					</div>
				</div>

				<Separator className="my-2" />

				<div className="flex-1 overflow-y-auto">
					{(() => {
						const tabItems = [
							{
								id: "targeting",
								title: isMobile ? "Targeting" : "Targeting & Variations",
							},
							...(isMobile ? [{ id: "variations", title: "Variations" }] : []),
							{ id: "preview", title: "Preview / Emulation" },
							{ id: "monitoring", title: "Monitoring" },
						];

						return (
							<Tabs
								selectedKey={activeTab}
								onSelectionChange={(key) => setActiveTab(key as string)}
								variant="secondary"
								className="w-full">
								<Tabs.ListContainer>
									<Tabs.List
										aria-label="Editor tabs"
										className="gap-6 w-full relative rounded-none p-0 border-b border-divider *:data-[selected=true]:text-primary *:h-12 *:w-fit *:px-0">
										{tabItems.map((item) => (
											<Tabs.Tab id={item.id} key={item.id}>
												{item.title}
												<Tabs.Indicator />
											</Tabs.Tab>
										))}
									</Tabs.List>
								</Tabs.ListContainer>
								<Tabs.Panel id="targeting">
									{isMobile ? (
										<TargetingTab flag={flag} />
									) : (
										<div className="flex gap-6 h-full min-h-125">
											<div className="flex-1">
												<TargetingTab flag={flag} />
											</div>
											<div className="w-1/3 shrink-0">
												<VariationsTab flag={flag} />
											</div>
										</div>
									)}
								</Tabs.Panel>
								<Tabs.Panel
									id="variations"
									className={!isMobile ? "hidden" : ""}>
									<VariationsTab flag={flag} />
								</Tabs.Panel>
								<Tabs.Panel id="preview">
									<PreviewTab flag={flag} />
								</Tabs.Panel>
								<Tabs.Panel id="monitoring">
									<MonitoringTab flag={flag} />
								</Tabs.Panel>
							</Tabs>
						);
					})()}
				</div>
			</div>
		</FormProvider>
	);
}

interface FlagEditorLayoutProps {
	flag: FeatureFlag;
	projectSlug: string;
}

export function FlagEditorLayout(props: FlagEditorLayoutProps) {
	return (
		<FlagEditorProvider flag={props.flag}>
			<EditorContent {...props} />
		</FlagEditorProvider>
	);
}
