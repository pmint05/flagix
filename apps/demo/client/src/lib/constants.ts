import type { ContextPreset } from "@/types";

export const DEFAULT_SDK_KEY = "sdk_client_devkey123abcdefghijklmnopqrstuv";
export const DEFAULT_BASE_URL = "http://localhost:9000/api/v1";
export const DEMO_SERVER_URL = "http://localhost:3002";

// Client flags: evaluated by React SDK (useFlag hook) — UI-only concerns
// Server flags: evaluated by Express API (fetch) — business logic / A/B tests / kill switches
export const FLAG_KEYS = {
	DARK_MODE: "dark-mode",         // client: dark/light theme toggle
	NEW_HOMEPAGE: "new-homepage",   // server: canary release, fetched via /api/content/hero
	PROMO_BANNER: "promo-banner",   // server: promo banner, fetched via /api/content/hero
	THEME_ACCENT: "theme-color",    // client: accent color switch
	BETA_ANALYTICS: "beta-analytics", // server: beta feature kill-switch, fetched via /api/content/features
	HERO_HEADLINE: "hero-headline", // server: A/B test headline, fetched via /api/content/hero
	PRICING_HERO: "pricing-hero",   // server: A/B test pricing, fetched via /api/content/pricing
} as const;

export const ACCENT_COLORS = {
	blue: { name: "Blue", css: "accent-blue" },
	"dark-slate": { name: "Dark Slate", css: "accent-dark-slate" },
	"light-blue": { name: "Light Blue", css: "accent-light-blue" },
	rose: { name: "Rose", css: "accent-rose" },
} as const;

export type AccentKey = keyof typeof ACCENT_COLORS;

export const CONTEXT_PRESETS: ContextPreset[] = [
	{
		name: "Anonymous Visitor",
		description: "Canary Release — first-time visitor, no account. Sees default homepage unless in rollout group.",
		context: {
			userId: "anon_visitor_01",
			role: undefined,
			attributes: {
				country: "US",
				isAuthenticated: false,
			},
		},
	},
	{
		name: "Free Tier User",
		description: "Tier Gating — free plan user. Premium features (SSO, custom targeting) hidden.",
		context: {
			userId: "user_free_01",
			role: "member",
			attributes: {
				country: "VN",
				plan: "free",
				isPremium: false,
			},
		},
	},
	{
		name: "Pro Tier User",
		description: "A/B Testing — pro subscriber. Sees tailored hero-headline variant.",
		context: {
			userId: "user_pro_01",
			role: "member",
			attributes: {
				country: "US",
				plan: "pro",
				isPremium: true,
				seats: 5,
			},
		},
	},
	{
		name: "Enterprise Admin",
		description: "Tier Gating + Geo Targeting — enterprise admin in EU. All features + EU data residency + enterprise pricing.",
		context: {
			userId: "user_ent_01",
			role: "admin",
			attributes: {
				country: "DE",
				region: "EU",
				plan: "enterprise",
				isPremium: true,
				companySize: 500,
			},
		},
	},
	{
		name: "Beta Tester",
		description: "Beta Program + Kill Switch — developer with betaAccess. Sees beta-analytics unless flag is killed.",
		context: {
			userId: "user_beta_01",
			role: "developer",
			attributes: {
				country: "JP",
				plan: "pro",
				betaAccess: true,
				os: "iOS",
			},
		},
	},
	{
		name: "EU Data Subject",
		description: "Geo Targeting — free user in France. GDPR-required features activated via region=EU.",
		context: {
			userId: "user_eu_01",
			role: "member",
			attributes: {
				country: "FR",
				region: "EU",
				plan: "free",
				gdprRequired: true,
			},
		},
	},
	{
		name: "Ops Team Lead",
		description: "A/B Testing + Promo Banner — enterprise admin in UK. Gets ops-focused headline + may see promo.",
		context: {
			userId: "user_ops_01",
			role: "admin",
			attributes: {
				country: "UK",
				plan: "enterprise",
				isPremium: true,
				team: "platform",
			},
		},
	},
	{
		name: "Dark Mode Enthusiast",
		description: "Kill Switch — pro user with dark preference. dark-mode ON, beta-analytics OFF (killed).",
		context: {
			userId: "user_dark_01",
			role: "developer",
			attributes: {
				country: "UK",
				plan: "pro",
				prefersDarkMode: true,
			},
		},
	},
];

export const NAV_LINKS = [
	{ label: "Features", href: "#features" },
	{ label: "Pricing", href: "#pricing" },
	{ label: "Live Demo", href: "#demo" },
	{ label: "Docs", href: "#docs" },
] as const;

export const FEATURES = [
	{
		title: "Instant Rollout",
		description:
			"Deploy features to production in minutes with zero downtime. Toggle features on/off without deploying code.",
		icon: "LightningIcon",
	},
	{
		title: "Targeting Rules",
		description:
			"Target specific users, regions, or devices with granular rules. Percentage rollouts, user attributes, and more.",
		icon: "TargetIcon",
	},
	{
		title: "Real-time Updates",
		description:
			"Changes propagate instantly via WebSocket connections. No polling, no delays, always in sync.",
		icon: "BroadcastIcon",
	},
	{
		title: "Team Collaboration",
		description:
			"Role-based access control, audit logs, and change history. Your team stays aligned and accountable.",
		icon: "UsersThreeIcon",
	},
	{
		title: "SDK Integration",
		description:
			"Drop-in SDKs for React, Node.js, and more. Lightweight, type-safe, with built-in caching and offline support.",
		icon: "CodeBlockIcon",
	},
	{
		title: "Analytics Dashboard",
		description:
			"Track flag evaluation metrics, user exposure, and experiment results with built-in analytics.",
		icon: "ChartBarIcon",
	},
] as const;

export const PRICING_PLANS = [
	{
		name: "Starter",
		price: "$0",
		period: "forever",
		description: "For small teams getting started with feature flags.",
		features: [
			"Up to 5 team members",
			"10 feature flags",
			"Basic targeting",
			"7-day audit log",
			"Community support",
		],
		cta: "Start Free",
		highlighted: false,
		flagValue: "starter",
	},
	{
		name: "Pro",
		price: "$49",
		period: "/month",
		description: "For growing teams that need advanced controls.",
		features: [
			"Up to 25 team members",
			"Unlimited feature flags",
			"Advanced targeting rules",
			"30-day audit log",
			"Priority support",
			"Webhook integrations",
		],
		cta: "Start Pro Trial",
		highlighted: true,
		flagValue: "pro",
	},
	{
		name: "Enterprise",
		price: "Custom",
		period: "",
		description: "For large organizations with custom needs.",
		features: [
			"Unlimited team members",
			"Unlimited feature flags",
			"Custom targeting rules",
			"Unlimited audit log",
			"Dedicated support",
			"SSO & SAML",
			"On-premise option",
		],
		cta: "Contact Sales",
		highlighted: false,
		flagValue: "enterprise",
	},
] as const;
