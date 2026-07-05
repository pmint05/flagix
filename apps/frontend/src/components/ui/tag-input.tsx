"use client";
import { useState } from "react";
import {
	TagGroup,
	Tag,
	Popover,
	TextField,
	Input,
	ListBox,
	Button,
	SearchField,
} from "@heroui/react";
import type { Key } from "@heroui/react";
import { TagIcon, PlusIcon } from "@phosphor-icons/react";
import { useTagsSearch } from "@/features/flags/api";
import { useDebounce } from "@/hooks/useDebounce";

interface TagInputProps {
	value?: string[];
	onChange?: (value: string[]) => void;
	placeholder?: string;
	allowCreation?: boolean;
}

export function TagInput({
	value = [],
	onChange,
	placeholder = "Add tags...",
	allowCreation = true,
}: TagInputProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedQuery = useDebounce(searchQuery, 300);

	const { data: suggestions = [] } = useTagsSearch(debouncedQuery);

	const handleAddTag = (tag: string) => {
		const trimmed = tag.trim();
		if (!trimmed) return;
		if (!value.includes(trimmed)) {
			onChange?.([...value, trimmed]);
		}
		setSearchQuery("");
		setIsOpen(false);
	};

	const handleRemoveTag = (keys: Set<Key>) => {
		const updated = value.filter((_, idx) => !keys.has(idx));
		onChange?.(updated);
	};

	const showCreateOption =
		allowCreation &&
		debouncedQuery.trim().length > 0 &&
		!suggestions.some(
			(s) => s.toLowerCase() === debouncedQuery.trim().toLowerCase(),
		) &&
		!value.some((t) => t.toLowerCase() === debouncedQuery.trim().toLowerCase());

	const filteredSuggestions = suggestions.filter((s) => !value.includes(s));

	return (
		<div className="flex flex-col gap-2 w-full">
			<div className="flex flex-wrap items-center gap-2">
				<TagGroup
					selectionMode="none"
					onRemove={handleRemoveTag}
					aria-label="Selected tags">
					<TagGroup.List
						items={value.map((tag, idx) => ({ id: idx, name: tag }))}
						renderEmptyState={() => (
							<span className="text-xs text-muted-foreground">
								{placeholder}
							</span>
						)}>
						{(item) => (
							<Tag key={item.id} id={item.id} textValue={item.name} size="lg">
								{item.name}
							</Tag>
						)}
					</TagGroup.List>
				</TagGroup>

				<Popover isOpen={isOpen} onOpenChange={setIsOpen}>
					<Popover.Trigger>
						<Button variant="outline" size="sm" className="h-8">
							<PlusIcon className="size-3.5" weight="bold" />
							{allowCreation ? "Add Tag" : "Filter Tags"}
						</Button>
					</Popover.Trigger>
					<Popover.Content className="p-3 w-64">
						<SearchField variant="secondary">
							<SearchField.Group>
							<SearchField.SearchIcon />
							<SearchField.Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={allowCreation ? "Search or type tag..." : "Search tags..."}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										if (allowCreation && searchQuery.trim()) {
											handleAddTag(searchQuery);
										}
									}
								}}
							/>
							</SearchField.Group>
						</SearchField>

						<ListBox
							className="max-h-48 overflow-y-auto"
							renderEmptyState={() => (
								<span className="text-xs text-muted-foreground px-2 py-3 block">
									{debouncedQuery.trim()
										? "No tags found"
										: allowCreation
											? "Type to search or create tags"
											: "Type to search tags"}
								</span>
							)}
							onAction={(key) => {
								if (key === "create-new-tag") {
									handleAddTag(searchQuery);
								} else {
									handleAddTag(key as string);
								}
							}}>
							{showCreateOption && (
								<ListBox.Item
									id="create-new-tag"
									textValue={searchQuery}
									className="text-primary font-medium">
									<div className="flex items-center gap-1.5">
										<PlusIcon className="size-4" />
										<span>Create tag "{searchQuery}"</span>
									</div>
								</ListBox.Item>
							)}
							{filteredSuggestions.map((suggestion) => (
								<ListBox.Item
									key={suggestion}
									id={suggestion}
									textValue={suggestion}>
									<div className="flex items-center gap-1.5">
										<TagIcon className="size-4 text-muted-foreground" />
										<span>{suggestion}</span>
									</div>
								</ListBox.Item>
							))}
						</ListBox>
					</Popover.Content>
				</Popover>
			</div>
		</div>
	);
}
