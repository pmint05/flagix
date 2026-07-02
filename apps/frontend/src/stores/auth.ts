import type { Session, User } from "#/lib/auth-client";
import { createPersistedStore } from "./ssr";

export interface AuthState {
	session: Session | null;
	user: User | null;
	setSession: (session: AuthState["session"], user: AuthState["user"]) => void;
	clearSession: () => void;
}

export type AuthUser = AuthState["user"];
export type AuthSession = AuthState["session"];

export const useAuthStore = createPersistedStore<AuthState>(
	(set) => ({
		session: null,
		user: null,
		setSession: (session, user) => set({ session, user }),
		clearSession: () => set({ session: null, user: null }),
	}),
	{ name: "flagix.auth" },
);
