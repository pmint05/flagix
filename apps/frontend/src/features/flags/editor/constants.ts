export const TYPE_OPTIONS = [
	{ key: "string", label: "String" },
	{ key: "number", label: "Number" },
	{ key: "boolean", label: "Boolean" },
	{ key: "object", label: "Object (JSON)" },
	{ key: "array", label: "Array" },
];

export const OPERATORS_BY_TYPE: Record<string, { key: string; label: string }[]> = {
	string: [
		{ key: "is_one_of", label: "Is one of" },
		{ key: "is_not_one_of", label: "Is not one of" },
		{ key: "contains", label: "Contains" },
		{ key: "not_contains", label: "Does not contain" },
		{ key: "starts_with", label: "Starts with" },
		{ key: "ends_with", label: "Ends with" },
		{ key: "matches_regex", label: "Matches regex" },
	],
	number: [
		{ key: "equals", label: "=" },
		{ key: "not_equals", label: "≠" },
		{ key: "gt", label: ">" },
		{ key: "gte", label: ">=" },
		{ key: "lt", label: "<" },
		{ key: "lte", label: "<=" },
		{ key: "is_one_of", label: "Is one of" },
		{ key: "is_not_one_of", label: "Is not one of" },
	],
	boolean: [
		{ key: "equals", label: "Is" },
		{ key: "not_equals", label: "Is not" },
	],
	object: [
		{ key: "has_key", label: "Has key" },
		{ key: "not_has_key", label: "Does not have key" },
		{ key: "equals_json", label: "Equals JSON" },
	],
	array: [
		{ key: "contains", label: "Contains" },
		{ key: "not_contains", label: "Does not contain" },
		{ key: "is_empty", label: "Is empty" },
		{ key: "is_not_empty", label: "Is not empty" },
	],
};
