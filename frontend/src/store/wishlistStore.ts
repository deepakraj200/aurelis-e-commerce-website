import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';
import { wishlistService } from '@/services/wishlistService';
import { useUiStore } from './uiStore';

interface WishlistState {
  mode: 'guest' | 'server';
  items: Product[];
  pendingIds: string[];
  initialized: boolean;
  bootstrap: (hasUser: boolean) => Promise<void>;
  toggle: (product: Product) => Promise<boolean>;
  remove: (productId: string, options?: { quiet?: boolean }) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  resetToGuest: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      mode: 'guest',
      items: [],
      pendingIds: [],
      initialized: false,

      bootstrap: async (hasUser) => {
        if (hasUser) {
          try {
            const localIds = get().mode === 'guest' ? get().items.map((item) => item._id) : [];
            if (localIds.length) await wishlistService.merge(localIds);
            const items = await wishlistService.get();
            set({ mode: 'server', items, initialized: true });
          } catch {
            set({ initialized: true });
          }
        } else {
          set({ mode: 'guest', initialized: true });
        }
      },

      toggle: async (product) => {
        if (get().pendingIds.includes(product._id)) return get().isWishlisted(product._id);
        const already = get().isWishlisted(product._id);
        set({ pendingIds: [...get().pendingIds, product._id] });

        try {
          if (get().mode === 'server') {
            const items = already
              ? await wishlistService.remove(product._id)
              : await wishlistService.add(product._id);
            set({ items, pendingIds: get().pendingIds.filter((id) => id !== product._id) });
          } else {
            const items = already
              ? get().items.filter((item) => item._id !== product._id)
              : [product, ...get().items];
            set({ items, pendingIds: get().pendingIds.filter((id) => id !== product._id) });
          }

          useUiStore.getState().pushActivity({
            title: already ? 'Removed from wishlist' : 'Saved to wishlist',
            message: product.name,
            href: '/wishlist',
            actionLabel: 'View wishlist',
          });
          return !already;
        } catch (error) {
          set({ pendingIds: get().pendingIds.filter((id) => id !== product._id) });
          throw error;
        }
      },

      remove: async (productId, options) => {
        if (get().mode === 'server') {
          const items = await wishlistService.remove(productId);
          set({ items });
        } else {
          set({ items: get().items.filter((item) => item._id !== productId) });
        }
        if (!options?.quiet) {
          useUiStore.getState().pushActivity({
            title: 'Removed from wishlist',
            message: 'The item has been removed.',
            href: '/wishlist',
            actionLabel: 'View wishlist',
          });
        }
      },

      isWishlisted: (productId) => get().items.some((item) => item._id === productId),

      resetToGuest: () => set({ mode: 'guest', items: [], pendingIds: [], initialized: false }),
    }),
    {
      name: 'aurelis-wishlist',
      partialize: (state) => (state.mode === 'guest' ? { items: state.items } : {}),
    }
  )
);
