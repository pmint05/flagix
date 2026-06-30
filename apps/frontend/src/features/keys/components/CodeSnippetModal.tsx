"use client";

import { useState } from "react";
import {
	Button,
	Modal,
	Autocomplete,
	useFilter,
	ListBox,
	SearchField,
} from "@heroui/react";
import Editor from "@monaco-editor/react";
import { useThemeStore } from "@/stores";
import CopyButton from "#/components/ui/copy-button";
import {
	React as ReactIcon,
	NodeJs as NodeJsIcon,
	Bash as BashIcon,
} from "developer-icons";
import { CaretDownIcon } from "@phosphor-icons/react";
import type { SdkKey } from "@/types/sdk-key";

export const SDKS = [
	{ id: "react", name: "React SDK (@flagix/sdk-react)" },
	{ id: "nodejs", name: "JS/TS Core SDK (@flagix/sdk-core)" },
	{ id: "curl", name: "cURL (REST API)" },
];

interface CodeSnippetModalProps {
	isOpen: boolean;
	onClose: () => void;
	keys?: SdkKey[];
	flagKey?: string;
	contextJson?: string;
}

const getSdkLanguage = (sdk: string) => {
	switch (sdk) {
		case "react":
		case "nodejs":
			return "javascript";
		case "curl":
			return "shell";
		default:
			return "plaintext";
	}
};

const getSdkIcon = (sdkId: string, className = "size-4") => {
	switch (sdkId) {
		case "react":
			return <ReactIcon className={className} />;
		case "nodejs":
			return <NodeJsIcon className={className} />;
		case "curl":
			return <BashIcon className={className} />;
		default:
			return null;
	}
};

const generateSnippet = (
	sdk: string,
	flagKey: string,
	contextJson: string,
	clientKey: string,
	serverKey: string,
) => {
	let contextObj: any = {};
	try {
		contextObj = JSON.parse(contextJson);
	} catch (e) {
		contextObj = { userId: "user-123" };
	}

	const formattedContextJson = JSON.stringify(contextObj, null, 2);
	const sdkKeyVal = sdk === "react" ? clientKey : serverKey;

	switch (sdk) {
		case "react":
			return `import { FlagixProvider, FlagixClient, useFlag } from '@flagix/sdk-react';

const client = new FlagixClient({ 
  sdkKey: '${sdkKeyVal}' 
});

function App() {
  return (
    <FlagixProvider 
      client={client} 
      initialContext={${formattedContextJson.replace(/\n/g, "\n      ")}}
    >
      <MyComponent />
    </FlagixProvider>
  );
}

// Used in your child components
function MyComponent() {
  const { value: isEnabled, isLoading } = useFlag('${flagKey}', false);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isEnabled ? <NewFeature /> : <OldFeature />}
    </div>
  );
}`;

		case "nodejs":
			return `import { FlagixClient } from '@flagix/sdk-core';

const client = new FlagixClient({
  sdkKey: '${sdkKeyVal}',
  baseUrl: 'https://api.flagix.com/api/v1',
});

async function main() {
  // Initialize and fetch flags
  await client.init(${formattedContextJson.replace(/\n/g, "\n  ")});

  // Evaluate feature flag
  const isEnabled = client.getFlagValue('${flagKey}', false);

  if (isEnabled) {
    console.log('Feature is active!');
  } else {
    console.log('Feature is inactive.');
  }

  // Subscribe to real-time changes
  client.subscribe((flags) => {
    console.log('Flags updated:', flags);
  });
}`;

		case "curl":
			return `curl -X POST "https://api.flagix.com/api/v1/evaluate" \\
  -H "Content-Type: application/json" \\
  -H "X-SDK-Key: ${sdkKeyVal}" \\
  -d '{
    "flagKey": "${flagKey}",
    "context": ${formattedContextJson.replace(/\n/g, "\n    ")}
  }'`;

		default:
			return "";
	}
};

export function CodeSnippetModal({
	isOpen,
	onClose,
	keys,
	flagKey = "my-feature-flag",
	contextJson = JSON.stringify({ userId: "user-123" }, null, 2),
}: CodeSnippetModalProps) {
	const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
	const editorTheme = resolvedTheme === "dark" ? "vs-dark" : "light";
	const { contains } = useFilter({ sensitivity: "base" });

	const filteredSdks = SDKS;

	const [selectedSdk, setSelectedSdk] = useState<string>("react");

	// Safe guard: if SDK not in list, fallback
	const actualSdk = filteredSdks.some((s) => s.id === selectedSdk)
		? selectedSdk
		: "react";

	const activeKeys = keys || [];
	const clientKey = activeKeys.find((k) => k.type === "client" && k.isActive)?.rawKey || "sdk_client_YOUR_KEY";
	const serverKey = activeKeys.find((k) => k.type === "server" && k.isActive)?.maskedKey || "sdk_server_YOUR_KEY";

	const codeSnippet = generateSnippet(actualSdk, flagKey, contextJson, clientKey, serverKey);

	return (
		<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog className="max-w-3xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>SDK Integration Snippet</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="space-y-4">
							<p className="text-xs text-default-500">
								Use the following code snippets to integrate this feature flag
								in your application. The key parameters have been automatically pre-filled.
							</p>
							<div className="flex items-center justify-between gap-4">
								<Autocomplete
									variant="secondary"
									placeholder="Select SDK"
									value={actualSdk}
									onChange={(key) => setSelectedSdk((key as string) || "react")}
									aria-label="Select SDK"
									className="min-w-64">
									<Autocomplete.Trigger className="flex items-center gap-2">
										<Autocomplete.Value />
										<Autocomplete.Indicator>
											<CaretDownIcon />
										</Autocomplete.Indicator>
									</Autocomplete.Trigger>
									<Autocomplete.Popover placement="bottom">
										<Autocomplete.Filter filter={contains}>
											<SearchField variant="secondary" autoFocus>
												<SearchField.Group>
													<SearchField.SearchIcon />
													<SearchField.Input placeholder="Search SDK..." />
												</SearchField.Group>
											</SearchField>
											<ListBox className="p-1">
												{filteredSdks.map((sdk) => (
													<ListBox.Item
														id={sdk.id}
														key={sdk.id}
														textValue={sdk.name}>
														<div className="flex items-center gap-2">
															{getSdkIcon(sdk.id, "size-4 shrink-0")}
															<span className="font-medium text-sm">
																{sdk.name}
															</span>
														</div>
													</ListBox.Item>
												))}
											</ListBox>
										</Autocomplete.Filter>
									</Autocomplete.Popover>
								</Autocomplete>

								<CopyButton
									text={codeSnippet}
									showLabel
									buttonProps={{
										variant: "outline",
										className: "font-semibold",
									}}
								/>
							</div>

							<div className="border border-divider rounded-2xl overflow-hidden h-96 relative bg-background-tertiary">
								<Editor
									height="100%"
									language={getSdkLanguage(actualSdk)}
									value={codeSnippet}
									theme={editorTheme}
									options={{
										readOnly: true,
										minimap: { enabled: false },
										fontSize: 13,
										lineNumbers: "on",
										scrollBeyondLastLine: false,
										automaticLayout: true,
										tabSize: 2,
										padding: { top: 12, bottom: 12 },
										wordWrap: "on",
									}}
								/>
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="outline" onPress={onClose}>
								Close
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
