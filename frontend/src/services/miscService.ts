import api from './api';
import type { ApiEnvelope, RuntimeConfig } from '@/types';

export const miscService = {
  async config() {
    const { data } = await api.get<ApiEnvelope<RuntimeConfig>>('/config');
    return data.data;
  },

  async subscribe(email: string, source = 'footer') {
    const { data } = await api.post<ApiEnvelope<null>>('/newsletter', { email, source });
    return data.message || 'Welcome to AURELIS.';
  },

  async contact(payload: { name: string; email: string; subject: string; message: string }) {
    const { data } = await api.post<ApiEnvelope<{ reference: string }>>('/contact', payload);
    return data;
  },
};
