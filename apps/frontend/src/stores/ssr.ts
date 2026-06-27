import { useEffect, useState } from 'react';
import { create, type StateCreator } from 'zustand';
import {
  createJSONStorage,
  persist,
  type PersistOptions,
  type StateStorage,
} from 'zustand/middleware';

interface RegisterEntry {
  name: string;
  rehydrate: () => void | Promise<void>;
}

const registry: RegisterEntry[] = [];
const isSSR = typeof window === 'undefined';

/** No-op storage used during SSR so `persist` never touches `localStorage`. */
const ssrStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

/**
 * Create a persisted Zustand store that is SSR-safe.
 *
 * During SSR the persisted state is ignored (storage returns null), so the
 * store renders with its initial state. On the client, `useHydrateStores`
 * calls each registered store's `rehydrate()` once before the first paint
 * that depends on the persisted values.
 *
 * @example
 *   export const useAuthStore = createPersistedStore<AuthState>(
 *     (set) => ({ user: null, setUser: (u) => set({ user: u }) }),
 *     { name: 'flagix.auth' },
 *   );
 */
export function createPersistedStore<T>(
  initializer: StateCreator<T>,
  options: PersistOptions<T>,
) {
  const store = create<T>()(
    persist(initializer, {
      ...options,
      // Skip automatic hydration; we drive it from useHydrateStores.
      skipHydration: true,
      // Guard against `localStorage` access during SSR.
      storage: createJSONStorage(() =>
        isSSR ? ssrStorage : window.localStorage,
      ),
    }),
  );

  registry.push({
    name: options.name,
    rehydrate: () => store.persist.rehydrate(),
  });

  return store;
}

let _isHydrated = false;
const hydrationListeners = new Set<(hydrated: boolean) => void>();

/**
 * Mounted once in `routes/__root.tsx`. Rehydrates every registered persisted
 * store on the client. Safe to call multiple times — registration is a
 * module-level singleton, and Zustand's `rehydrate` is idempotent per store.
 */
export function useHydrateStores() {
  useEffect(() => {
    if (isSSR || _isHydrated) return;
    void Promise.all(registry.map((entry) => entry.rehydrate())).then(() => {
      _isHydrated = true;
      hydrationListeners.forEach((listener) => listener(true));
    });
  }, []);
}

/**
 * Returns true if the persisted stores have finished hydrating.
 *
 * Always initialises to `false` so the first render on both server and client
 * produces identical markup (avoiding hydration mismatch). The `useEffect`
 * callback — which only runs on the client — immediately flips to `true` when
 * stores have already been rehydrated.
 */
export function useIsHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (_isHydrated) {
      setHydrated(true);
      return;
    }
    const listener = (h: boolean) => setHydrated(h);
    hydrationListeners.add(listener);
    return () => {
      hydrationListeners.delete(listener);
    };
  }, []);
  return hydrated;
}
