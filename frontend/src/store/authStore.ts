import { create } from 'zustand';
import type { User } from '@/types';
import { authService } from '@/services/authService';
import { useCartStore } from './cartStore';
import { useWishlistStore } from './wishlistStore';

interface AuthState {
  user: User | null;
  initialized: boolean;
  loading: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
}

let bootstrapPromise: Promise<void> | null = null;

const syncStores = async (hasUser: boolean) => {
  await Promise.allSettled([
    useCartStore.getState().bootstrap(hasUser),
    useWishlistStore.getState().bootstrap(hasUser),
  ]);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  loading: false,

  bootstrap: async () => {
    if (get().initialized) return;
    if (!bootstrapPromise) {
      bootstrapPromise = (async () => {
        let user: User | null = null;
        try {
          user = await authService.me();
        } catch {
          user = null;
        }
        set({ user, initialized: true });
        await syncStores(Boolean(user));
      })();
    }
    await bootstrapPromise;
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const user = await authService.login({ email, password });
      set({ user, loading: false, initialized: true });
      bootstrapPromise = null;
      await syncStores(true);
      return user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const user = await authService.register(payload);
      set({ user, loading: false, initialized: true });
      bootstrapPromise = null;
      await syncStores(true);
      return user;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      bootstrapPromise = null;
      set({ user: null, initialized: true });
      useCartStore.getState().resetToGuest();
      useWishlistStore.getState().resetToGuest();
    }
  },

  setUser: (user) => set({ user }),

  refresh: async () => {
    try {
      const user = await authService.me();
      set({ user });
    } catch {
      set({ user: null });
    }
  },
}));
