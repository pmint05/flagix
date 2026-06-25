import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:9000/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;
