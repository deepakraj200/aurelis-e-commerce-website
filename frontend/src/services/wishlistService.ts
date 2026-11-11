import api from './api';
import type { ApiEnvelope, Product } from '@/types';

export const wishlistService = {
  async get() {
    const { data } = await api.get<ApiEnvelope<Product[]>>('/wishlist');
    return data.data;
  },

  async add(productId: string) {
    const { data } = await api.post<ApiEnvelope<Product[]>>('/wishlist', { productId });
    return data.data;
  },

  async remove(productId: string) {
    const { data } = await api.delete<ApiEnvelope<Product[]>>(`/wishlist/${productId}`);
    return data.data;
  },

  async merge(productIds: string[]) {
    const { data } = await api.post<ApiEnvelope<Product[]>>('/wishlist/merge', { productIds });
    return data.data;
  },
};
