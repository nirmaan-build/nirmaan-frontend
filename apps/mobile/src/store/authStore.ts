import { create } from 'zustand';
import { storage, KEYS } from '../lib/storage';
import { User } from '../api/types';

export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'onboarding'
  | 'authenticated';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  hydrate: () => Promise<void>;
  setSession: (s: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  setAccessToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

function statusFor(user: User | null): AuthStatus {
  if (!user) return 'unauthenticated';
  return user.profileComplete ? 'authenticated' : 'onboarding';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'loading',
  accessToken: null,
  refreshToken: null,
  user: null,

  hydrate: async () => {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      storage.get(KEYS.accessToken),
      storage.get(KEYS.refreshToken),
      storage.get(KEYS.user),
    ]);
    const user = userJson ? (JSON.parse(userJson) as User) : null;
    if (accessToken && refreshToken && user) {
      set({ accessToken, refreshToken, user, status: statusFor(user) });
    } else {
      set({ status: 'unauthenticated' });
    }
  },

  setSession: async ({ accessToken, refreshToken, user }) => {
    await Promise.all([
      storage.set(KEYS.accessToken, accessToken),
      storage.set(KEYS.refreshToken, refreshToken),
      storage.set(KEYS.user, JSON.stringify(user)),
    ]);
    set({ accessToken, refreshToken, user, status: statusFor(user) });
  },

  setUser: async (user) => {
    await storage.set(KEYS.user, JSON.stringify(user));
    set({ user, status: statusFor(user) });
  },

  setAccessToken: async (token) => {
    await storage.set(KEYS.accessToken, token);
    set({ accessToken: token });
  },

  signOut: async () => {
    await Promise.all([
      storage.del(KEYS.accessToken),
      storage.del(KEYS.refreshToken),
      storage.del(KEYS.user),
    ]);
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: 'unauthenticated',
    });
  },
}));
