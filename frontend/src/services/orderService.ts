import api from './api';
import type { ApiEnvelope, ApiList, Order, PaymentIntent } from '@/types';

export interface CreateOrderPayload {
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'card' | 'cod';
  saveAddress?: boolean;
  idempotencyKey?: string;
}

export const orderService = {
  async create(payload: CreateOrderPayload) {
    const { data } = await api.post<ApiEnvelope<Order>>('/orders', payload);
    return { order: data.data, message: data.message };
  },

  async list(params: { page?: number; limit?: number; status?: string } = {}): Promise<ApiList<Order>> {
    const { data } = await api.get<ApiEnvelope<Order[]>>('/orders', { params });
    return {
      data: data.data,
      meta: data.meta || { page: 1, pages: 1, total: data.data.length, limit: data.data.length },
    };
  },

  async get(id: string) {
    const { data } = await api.get<ApiEnvelope<Order>>(`/orders/${id}`);
    return data.data;
  },

  async cancel(id: string, reason?: string) {
    const { data } = await api.put<ApiEnvelope<Order>>(`/orders/${id}/cancel`, { reason });
    return data.data;
  },

  async createPaymentIntent(orderId: string) {
    const { data } = await api.post<ApiEnvelope<PaymentIntent>>('/payments/intent', { orderId });
    return data.data;
  },

  async confirmPayment(orderId: string, paymentIntentId: string) {
    const { data } = await api.post<ApiEnvelope<Order>>('/payments/confirm', { orderId, paymentIntentId });
    return data.data;
  },
};
