"use client";
import { useEffect, useRef } from "react";
import { Accordion, Button, Switch } from "@heroui/react";
import Editor from "@monaco-editor/react";
import {
	PlayIcon,
	BracketsCurlyIcon,
	SparkleIcon,
} from "@phosphor-icons/react";

interface SimulationLeftPanelProps {
	jsonValue: string;
	onChange: (val: string) => void;
	onFormatJson: () => void;
	onSimulate: () => void;
	isPending: boolean;
	jsonError: string | null;
	onOpenSnippet: () => void;
	editorTheme: string;
	presets: Array<{ name: string; value: string }>;
	options: {
		bypassDraft: boolean;
	};
	onOptionsChange: (opts: { bypassDraft: boolean }) => void;
}

export function SimulationLeftPanel({
	jsonValue,
	onChange,
	onFormatJson,
	onSimulate,
	isPending,
	jsonError,
	onOpenSnippet,
	editorTheme,
	presets,
	options,
	onOptionsChange,
}: SimulationLeftPanelProps) {
	const onSimulateRef = useRef(onSimulate);

	useEffect(() => {
		onSimulateRef.current = onSimulate;
	}, [onSimulate]);

	const handleEditorChange = (val: string | undefined) => {
		onChange(val || "");
	};

	const handleEditorDidMount = (editor: any, monaco: any) => {
		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
			onSimulateRef.current();
		});

		monaco.languages.registerCompletionItemProvider("json", {
			provideCompletionItems: (_model: any, _position: any) => {
				const suggestions = [
					{
						label: '"flagKey"',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: '"flagKey": "$1"',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: "Feature flag key (required)",
					},
					{
						label: '"context"',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: '"context": {\n\t"userId": "$1"\n}',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: "Evaluation context object",
					},
					{
						label: '"userId"',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: '"userId": "$1"',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: "User unique identifier",
					},
					{
						label: '"role"',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: '"role": "$1"',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: "User security role",
					},
					{
						label: '"attributes"',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: '"attributes": {\n\t"$1": "$2"\n}',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: "Custom attributes object",
					},
					{
						label: '"plan"',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: '"plan": "$1"',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: "Pricing plan level",
					},
					{
						label: '"email"',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: '"email": "$1"',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: "User email address",
					},
					{
						label: '"country"',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: '"country": "$1"',
						insertTextRules:
							monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: "ISO country code",
					},
				];

				return { suggestions };
			},
		});
	};

	return (
		<div className="flex flex-col h-full bg-background dark:bg-background-tertiary">
			<div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
				<div className="flex items-center gap-4">
					<span className="font-semibold text-foreground text-sm">
						Evaluate Request Body
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button size="sm" variant="outline" onPress={onOpenSnippet}>
						<BracketsCurlyIcon className="size-3.5" />
						Code Snippet
					</Button>
					<Button size="sm" variant="ghost" onPress={onFormatJson}>
						<SparkleIcon />
						Pretty
					</Button>
					<Button
						variant="primary"
						size="sm"
						onPress={onSimulate}
						isPending={isPending}>
						{!isPending && <PlayIcon className="size-3.5" weight="bold" />}
						Run
					</Button>
				</div>
			</div>

			{/* Preset Selector */}
			<div className="border-b border-divider/60">
				<Accordion>
					<Accordion.Item>
						<Accordion.Heading>
							<Accordion.Trigger className="py-2">
								<span className="font-medium">Presets</span>
								<Accordion.Indicator />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body>
								{presets.map((preset) => (
									<Button
										key={preset.name}
										size="sm"
										variant="outline"
										className="h-6 px-2 rounded-xl"
										onPress={() => onChange(preset.value)}>
										{preset.name}
									</Button>
								))}
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
					<Accordion.Item>
						<Accordion.Heading>
							<Accordion.Trigger className="py-2">
								<span className="font-medium">Options</span>
								<Accordion.Indicator />
							</Accordion.Trigger>
						</Accordion.Heading>
						<Accordion.Panel>
							<Accordion.Body>
								<div className="flex items-center gap-2 flex-wrap">
									<span className="font-medium select-none">Bypass Draft</span>
									<Switch
										size="sm"
										isSelected={options.bypassDraft}
										onChange={(checked) =>
											onOptionsChange({ ...options, bypassDraft: checked })
										}
										aria-label="Bypass Draft status">
										<Switch.Content>
											<Switch.Control>
												<Switch.Thumb />
											</Switch.Control>
										</Switch.Content>
									</Switch>
								</div>
							</Accordion.Body>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			</div>

			{/* Editor container */}
			<div className="flex-1 min-h-0 relative">
				<Editor
					height="100%"
					defaultLanguage="json"
					value={jsonValue}
					onChange={handleEditorChange}
					onMount={handleEditorDidMount}
					theme={editorTheme}
					options={{
						minimap: { enabled: false },
						fontSize: 13,
						lineNumbers: "on",
						scrollBeyondLastLine: false,
						automaticLayout: true,
						tabSize: 2,
						formatOnPaste: true,
						padding: { top: 12, bottom: 12 },
					}}
				/>
			</div>

			{/* Error box */}
			{jsonError && (
				<div className="p-3 bg-danger/10 border-t border-danger/20 text-danger text-xs font-mono whitespace-pre-wrap">
					{jsonError}
				</div>
			)}
		</div>
	);
}
