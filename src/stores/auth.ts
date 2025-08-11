import { writable, derived } from 'svelte/store';
import type { User } from '$lib/api';

export interface AuthState {
  user: User | null;
  expiresAt: number | null;
}

const initialState: AuthState = {
  user: null,
  expiresAt: null,
};

function createAuthStore() {
  const { subscribe, set } = writable<AuthState>(initialState);

  return {
    subscribe,
    setLogin: (user: User, expires_at: string) => {
      const expiresAt = new Date(expires_at).getTime();
      const state: AuthState = { user, expiresAt };
      set(state);
    },
    logout: () => {
      set(initialState);
    },
  };
}

export const authStore = createAuthStore();

export const isAuthenticated = derived(authStore, ($auth) => {
  return !!$auth.user && !!$auth.expiresAt && Date.now() < $auth.expiresAt;
});

export const isAdmin = derived(
  [authStore, isAuthenticated],
  ([$auth, $isAuth]) => $isAuth && $auth.user?.role === 'admin'
); 