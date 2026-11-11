import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartLine, CartSummary, Product } from '@/types';
import { cartService } from '@/services/cartService';
import { useUiStore } from './uiStore';
import { SHIPPING } from '@/utils/constants';

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const summarize = (items: CartLine[]): CartSummary => {
  const subtotal = round2(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0));
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingCost = subtotal >= SHIPPING.freeThreshold || subtotal === 0 ? 0 : SHIPPING.fee;
  const tax = round2(subtotal * SHIPPING.taxRate);
  return { subtotal, shippingCost, tax, totalAmount: round2(subtotal + shippingCost + tax), count };
};

const emptySummary: CartSummary = { subtotal: 0, shippingCost: 0, tax: 0, totalAmount: 0, count: 0 };

const localId = (productId: string, color: string, size: string) => `local-${productId}-${color}-${size}`;

const toLocalLine = (product: Product, quantity: number, color: string, size: string): CartLine => ({
  _id: localId(product._id, color, size),
  product,
  quantity,
  color,
  size,
  lineTotal: round2(product.price * quantity),
});

const notifyAdd = (product: Product) => {
  useUiStore.getState().pushActivity({
    title: 'Added to your bag',
    message: product.name,
    href: '/cart',
    actionLabel: 'View bag',
    tone: 'accent',
  });
};

interface AddOptions {
  quantity?: number;
  color?: string;
  size?: string;
}

interface CartState {
  mode: 'guest' | 'server';
  items: CartLine[];
  summary: CartSummary;
  drawerOpen: boolean;
  loading: boolean;
  initialized: boolean;
  bootstrap: (hasUser: boolean) => Promise<void>;
  add: (product: Product, options?: AddOptions) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  resetToGuest: () => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      mode: 'guest',
      items: [],
      summary: emptySummary,
      drawerOpen: false,
      loading: false,
      initialized: false,

      bootstrap: async (hasUser) => {
        set({ loading: true });
        try {
          if (hasUser) {
            const guestItems = get().mode === 'guest' ? get().items : [];
            if (guestItems.length) {
              await cartService.merge(
                guestItems.map((item) => ({
                  productId: item.product._id,
                  quantity: item.quantity,
                  color: item.color,
                  size: item.size,
                }))
              );
            }
            const cart = await cartService.get();
            set({
              mode: 'server',
              items: cart.items,
              summary: cart.summary,
              loading: false,
              initialized: true,
            });
          } else {
            const items = get().mode === 'guest' ? get().items : [];
            set({ mode: 'guest', items, summary: summarize(items), loading: false, initialized: true });
          }
        } catch {
          set({ loading: false, initialized: true });
        }
      },

      add: async (product, options = {}) => {
        const quantity = Math.max(1, options.quantity || 1);
        const color = options.color || product.colors[0]?.name || '';
        const size = options.size || product.sizes[0] || '';

        if (product.stock < 1) {
          throw new Error('This product is currently out of stock.');
        }

        if (get().mode === 'server') {
          const response = await cartService.add({ productId: product._id, quantity, color, size });
          set({
            items: response.data.items,
            summary: response.data.summary,
          });
        } else {
          const items = [...get().items];
          const existingIndex = items.findIndex(
            (item) =>
              item.product._id === product._id && item.color === color && item.size === size
          );
          const existingQuantity = existingIndex >= 0 ? items[existingIndex].quantity : 0;
          const nextQuantity = existingQuantity + quantity;
          if (nextQuantity > product.stock) {
            throw new Error(`Only ${product.stock} unit(s) of ${product.name} are available.`);
          }
          if (nextQuantity > 20) {
            throw new Error('You can add up to 20 units of one item.');
          }
          if (existingIndex >= 0) {
            items[existingIndex] = {
              ...items[existingIndex],
              quantity: nextQuantity,
              lineTotal: round2(product.price * nextQuantity),
            };
          } else {
            items.push(toLocalLine(product, quantity, color, size));
          }
          set({ items, summary: summarize(items) });
        }

        notifyAdd(product);
      },

      updateQuantity: async (itemId, quantity) => {
        const nextQuantity = Math.max(1, Math.min(20, quantity));
        if (get().mode === 'server') {
          const cart = await cartService.update(itemId, nextQuantity);
          set({ items: cart.items, summary: cart.summary });
        } else {
          const items = get().items.map((item) => {
            if (item._id !== itemId) return item;
            const capped = Math.min(nextQuantity, item.product.stock);
            return {
              ...item,
              quantity: capped,
              lineTotal: round2(item.product.price * capped),
            };
          });
          set({ items, summary: summarize(items) });
        }
      },

      remove: async (itemId) => {
        if (get().mode === 'server') {
          const cart = await cartService.remove(itemId);
          set({ items: cart.items, summary: cart.summary });
        } else {
          const items = get().items.filter((item) => item._id !== itemId);
          set({ items, summary: summarize(items) });
        }
      },

      clear: async () => {
        if (get().mode === 'server') {
          const cart = await cartService.clear();
          set({ items: cart.items, summary: cart.summary });
        } else {
          set({ items: [], summary: emptySummary });
        }
      },

      refresh: async () => {
        if (get().mode === 'server') {
          const cart = await cartService.get();
          set({ items: cart.items, summary: cart.summary });
        }
      },

      resetToGuest: () => set({ mode: 'guest', items: [], summary: emptySummary, drawerOpen: false }),

      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
    }),
    {
      name: 'aurelis-cart',
      partialize: (state) => (state.mode === 'guest' ? { items: state.items, summary: state.summary } : {}),
    }
  )
);

export const selectCartCount = (state: CartState) => state.summary.count;
