import { create } from 'zustand';
import type { Product } from '@/types';

export interface Activity {
  id: number;
  title: string;
  message: string;
  href?: string;
  actionLabel?: string;
  tone?: 'default' | 'accent';
}

interface ActivityInput {
  title: string;
  message: string;
  href?: string;
  actionLabel?: string;
  tone?: 'default' | 'accent';
  duration?: number;
}

interface UiState {
  activity: Activity | null;
  cartOpen: boolean;
  quickView: Product | null;
  searchOpen: boolean;
  pushActivity: (input: ActivityInput) => void;
  dismissActivity: () => void;
  setCartOpen: (open: boolean) => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  setSearchOpen: (open: boolean) => void;
}

let activityTimer: ReturnType<typeof setTimeout> | undefined;
let activityId = 0;

export const useUiStore = create<UiState>((set) => ({
  activity: null,
  cartOpen: false,
  quickView: null,
  searchOpen: false,

  pushActivity: (input) => {
    if (activityTimer) clearTimeout(activityTimer);
    activityId += 1;
    set({
      activity: {
        id: activityId,
        title: input.title,
        message: input.message,
        href: input.href,
        actionLabel: input.actionLabel,
        tone: input.tone || 'default',
      },
    });
    activityTimer = setTimeout(() => {
      set((state) => (state.activity?.id === activityId ? { activity: null } : state));
    }, input.duration || 5200);
  },

  dismissActivity: () => {
    if (activityTimer) clearTimeout(activityTimer);
    set({ activity: null });
  },

  setCartOpen: (cartOpen) => set({ cartOpen }),
  openQuickView: (quickView) => set({ quickView }),
  closeQuickView: () => set({ quickView: null }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));
