import { createPersistedStore } from './ssr';

interface AuthState {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  } | null;
  setSession: (
    session: AuthState['session'],
    user: AuthState['user'],
  ) => void;
  clearSession: () => void;
}

export const useAuthStore = createPersistedStore<AuthState>(
  (set) => ({
    session: null,
    user: null,
    setSession: (session, user) => set({ session, user }),
    clearSession: () => set({ session: null, user: null }),
  }),
  { name: 'flagix.auth' },
);
