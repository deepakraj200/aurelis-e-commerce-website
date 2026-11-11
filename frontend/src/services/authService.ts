import api from './api';
import type { Address, ApiEnvelope, User } from '@/types';

interface AuthPayload {
  user: User;
  token?: string;
}

export const authService = {
  async register(payload: { name: string; email: string; password: string }) {
    const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/register', payload);
    return data.data.user;
  },

  async login(payload: { email: string; password: string }) {
    const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/login', payload);
    return data.data.user;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async me() {
    const { data } = await api.get<ApiEnvelope<AuthPayload>>('/auth/me');
    return data.data.user;
  },

  async updateProfile(payload: { name?: string; phone?: string; avatar?: string }) {
    const { data } = await api.put<ApiEnvelope<AuthPayload>>('/auth/profile', payload);
    return data.data.user;
  },

  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const { data } = await api.put<ApiEnvelope<{ token: string }>>('/auth/password', payload);
    return data;
  },

  async forgotPassword(email: string) {
    const { data } = await api.post<ApiEnvelope<null> & { devResetUrl?: string }>('/auth/forgot-password', {
      email,
    });
    return data;
  },

  async resetPassword(payload: { token: string; password: string }) {
    const { data } = await api.post<ApiEnvelope<AuthPayload>>('/auth/reset-password', payload);
    return data.data.user;
  },

  async addAddress(payload: Address) {
    const { data } = await api.post<ApiEnvelope<{ addresses: Address[] }>>('/auth/addresses', payload);
    return data.data.addresses;
  },

  async updateAddress(id: string, payload: Partial<Address>) {
    const { data } = await api.put<ApiEnvelope<{ addresses: Address[] }>>(`/auth/addresses/${id}`, payload);
    return data.data.addresses;
  },

  async deleteAddress(id: string) {
    const { data } = await api.delete<ApiEnvelope<{ addresses: Address[] }>>(`/auth/addresses/${id}`);
    return data.data.addresses;
  },
};
