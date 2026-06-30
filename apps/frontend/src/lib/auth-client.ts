import { createAuthClient } from "better-auth/react";
// import type {} from "better-auth/react"
export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:9000/api/auth",
});

export type User = typeof authClient.$Infer.Session.user;
export type Session = typeof authClient.$Infer.Session;

export const { signIn, signUp, signOut, useSession } = authClient;
