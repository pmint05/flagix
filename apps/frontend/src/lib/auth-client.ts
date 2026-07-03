import { createAuthClient } from "better-auth/react";

const IS_SERVER = typeof window === "undefined";

const getAuthBaseUrl = () => {
	if (IS_SERVER) {
		return process.env.INTERNAL_AUTH_BASE_URL || import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:9000/api/auth";
	}
	return import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:9000/api/auth";
};

export const authClient = createAuthClient({
	baseURL: getAuthBaseUrl(),
});

export type User = typeof authClient.$Infer.Session.user;
export type Session = typeof authClient.$Infer.Session;

export const { signIn, signUp, signOut, useSession } = authClient;
