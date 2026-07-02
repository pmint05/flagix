export function getPresets(flagKey: string) {
	return [
		{
			name: "Anonymous Web Guest",
			value: JSON.stringify(
				{
					flagKey,
					context: {
						userId: "anon_web_7f8c1b92",
						role: "guest",
						attributes: {
							country: "VN",
							platform: "web",
							browser: "Chrome",
							isAnonymous: true,
							appVersion: "1.2.0",
						},
					},
				},
				null,
				2,
			),
		},
		{
			name: "VIP Enterprise Client (US)",
			value: JSON.stringify(
				{
					flagKey,
					context: {
						userId: "usr_ent_8a2d1e0f",
						role: "member",
						attributes: {
							email: "john.doe@enterprise.com",
							plan: "enterprise",
							country: "US",
							platform: "ios",
							appVersion: "2.4.1",
							organizationId: "org_acme_corp",
							betaTester: true,
						},
					},
				},
				null,
				2,
			),
		},
		{
			name: "Staging Admin User",
			value: JSON.stringify(
				{
					flagKey,
					context: {
						userId: "usr_adm_007ae812",
						role: "admin",
						attributes: {
							email: "security-ops@flagix.dev",
							plan: "unlimited",
							country: "SG",
							platform: "web",
							appVersion: "3.0.0-rc1",
							isInternal: true,
						},
					},
				},
				null,
				2,
			),
		},
		{
			name: "Standard Mobile User (Android)",
			value: JSON.stringify(
				{
					flagKey,
					context: {
						userId: "usr_std_9a8c7b6d",
						role: "member",
						attributes: {
							email: "user_test_99@gmail.com",
							plan: "free",
							country: "JP",
							platform: "android",
							appVersion: "1.8.9",
							registrationDate: "2026-06-01T12:00:00Z",
						},
					},
				},
				null,
				2,
			),
		},
	];
}

export const PRESETS = getPresets("your-flag-key");

export const SDKS = [
	{ id: "react", name: "React SDK (@flagix/sdk-react)" },
	{ id: "nodejs", name: "JS/TS Core SDK (@flagix/sdk-core)" },
	{ id: "curl", name: "cURL (REST API)" },
];
