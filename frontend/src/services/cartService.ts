import api from './api';
import type { ApiEnvelope, Cart } from '@/types';

export interface GuestCartEntry {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
}

export const cartService = {
  async get() {
    const { data } = await api.get<ApiEnvelope<Cart>>('/cart');
    return data.data;
  },

  async add(payload: { productId: string; quantity: number; color?: string; size?: string }) {
    const { data } = await api.post<ApiEnvelope<Cart>>('/cart', payload);
    return data;
  },

  async update(itemId: string, quantity: number) {
    const { data } = await api.put<ApiEnvelope<Cart>>(`/cart/${itemId}`, { quantity });
    return data.data;
  },

  async remove(itemId: string) {
    const { data } = await api.delete<ApiEnvelope<Cart>>(`/cart/${itemId}`);
    return data.data;
  },

  async clear() {
    const { data } = await api.delete<ApiEnvelope<Cart>>('/cart');
    return data.data;
  },

  async merge(items: GuestCartEntry[]) {
    const { data } = await api.post<ApiEnvelope<Cart>>('/cart/merge', { items });
    return data.data;
  },
};
