export const ENV_TYPES = [
	{ key: "development", label: "Development" },
	{ key: "staging", label: "Staging" },
	{ key: "production", label: "Production" },
	{ key: "custom", label: "Custom" },
] as const;

export const ENV_STATUS_OPTIONS = [
	{ key: "all", label: "All status" },
	{ key: "active", label: "Active" },
	{ key: "inactive", label: "Inactive" },
] as const;

export const ENV_TYPE_FILTER_OPTIONS = [
	{ key: "all", label: "All types" },
	...ENV_TYPES,
] as const;
