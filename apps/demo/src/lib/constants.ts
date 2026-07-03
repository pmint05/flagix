import type { ContextPreset } from "@/types";

export const DEFAULT_SDK_KEY = "sdk_client_devkey123abcdefghijklmnopqrstuv";
export const DEFAULT_BASE_URL = "http://localhost:9000/api/v1";

export const FLAG_KEYS = {
	DARK_MODE: "dark-mode",
	NEW_HOMEPAGE: "new-homepage",
	PROMO_BANNER: "promo-banner",
	THEME_ACCENT: "theme-color",
	BETA_ANALYTICS: "beta-analytics",
	HERO_HEADLINE: "hero-headline",
	PRICING_HERO: "pricing-hero",
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
		description: "First-time visitor, no account",
		context: {
			userId: "anon_visitor_01",
			role: undefined,
			attributes: {
				device: "Desktop",
				browser: "Chrome",
				country: "US",
				isAuthenticated: false,
			},
		},
	},
	{
		name: "Free Tier User",
		description: "Registered user on free plan",
		context: {
			userId: "user_free_01",
			role: "member",
			attributes: {
				device: "Desktop",
				browser: "Firefox",
				country: "VN",
				plan: "free",
				isPremium: false,
			},
		},
	},
	{
		name: "Pro Tier User",
		description: "Premium subscriber with full access",
		context: {
			userId: "user_pro_01",
			role: "member",
			attributes: {
				device: "Desktop",
				browser: "Chrome",
				country: "US",
				plan: "pro",
				isPremium: true,
				seats: 5,
			},
		},
	},
	{
		name: "Enterprise Admin",
		description: "Large org admin with all features",
		context: {
			userId: "user_ent_01",
			role: "admin",
			attributes: {
				device: "Desktop",
				browser: "Edge",
				country: "DE",
				plan: "enterprise",
				isPremium: true,
				companySize: 500,
				region: "EU",
			},
		},
	},
	{
		name: "Mobile Beta Tester",
		description: "Beta tester on mobile device",
		context: {
			userId: "user_beta_01",
			role: "developer",
			attributes: {
				device: "Mobile",
				browser: "Safari",
				country: "JP",
				betaAccess: true,
				isMobile: true,
				os: "iOS",
			},
		},
	},
	{
		name: "Dark Mode User",
		description: "User who prefers dark interfaces",
		context: {
			userId: "user_dark_01",
			role: "member",
			attributes: {
				device: "Desktop",
				browser: "Chrome",
				country: "UK",
				prefersDarkMode: true,
				plan: "pro",
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
