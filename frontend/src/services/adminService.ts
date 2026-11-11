import api from './api';
import type {
  AdminCustomer,
  ApiEnvelope,
  ApiList,
  Category,
  DashboardData,
  Order,
  Product,
} from '@/types';

export const adminService = {
  async dashboard() {
    const { data } = await api.get<ApiEnvelope<DashboardData>>('/admin/dashboard');
    return data.data;
  },

  async orders(params: { page?: number; limit?: number; status?: string; q?: string } = {}): Promise<ApiList<Order>> {
    const { data } = await api.get<ApiEnvelope<Order[]>>('/admin/orders', { params });
    return {
      data: data.data,
      meta: data.meta || { page: 1, pages: 1, total: data.data.length, limit: data.data.length },
    };
  },

  async order(id: string) {
    const { data } = await api.get<ApiEnvelope<Order>>(`/admin/orders/${id}`);
    return data.data;
  },

  async updateOrderStatus(id: string, status: string, note?: string) {
    const { data } = await api.put<ApiEnvelope<Order>>(`/admin/orders/${id}/status`, { status, note });
    return data.data;
  },

  async cancelOrder(id: string, reason?: string) {
    const { data } = await api.put<ApiEnvelope<Order>>(`/admin/orders/${id}/cancel`, { reason });
    return data.data;
  },

  async refundOrder(id: string) {
    const { data } = await api.post<ApiEnvelope<Order>>(`/admin/orders/${id}/refund`);
    return data.data;
  },

  async customers(params: { page?: number; limit?: number; q?: string; role?: string } = {}): Promise<ApiList<AdminCustomer>> {
    const { data } = await api.get<ApiEnvelope<AdminCustomer[]>>('/admin/users', { params });
    return {
      data: data.data,
      meta: data.meta || { page: 1, pages: 1, total: data.data.length, limit: data.data.length },
    };
  },

  async customer(id: string) {
    const { data } = await api.get<
      ApiEnvelope<{ user: AdminCustomer; orders: Order[]; stats: { orderCount: number; spent: number } }>
    >(`/admin/users/${id}`);
    return data.data;
  },

  async updateCustomer(id: string, payload: { isActive?: boolean; role?: 'user' | 'admin' }) {
    const { data } = await api.patch<ApiEnvelope<AdminCustomer>>(`/admin/users/${id}`, payload);
    return data.data;
  },

  async products(params: { page?: number; limit?: number; q?: string; status?: string; category?: string } = {}): Promise<
    ApiList<Product>
  > {
    const { data } = await api.get<ApiEnvelope<Product[]>>('/admin/products', { params });
    return {
      data: data.data,
      meta: data.meta || { page: 1, pages: 1, total: data.data.length, limit: data.data.length },
    };
  },

  async createProduct(payload: Partial<Product> & Record<string, unknown>) {
    const { data } = await api.post<ApiEnvelope<Product>>('/products', payload);
    return data.data;
  },

  async updateProduct(id: string, payload: Partial<Product> & Record<string, unknown>) {
    const { data } = await api.put<ApiEnvelope<Product>>(`/products/${id}`, payload);
    return data.data;
  },

  async deleteProduct(id: string) {
    const { data } = await api.delete<ApiEnvelope<null>>(`/products/${id}`);
    return data;
  },

  async createCategory(payload: { name: string; description?: string; image?: string; featured?: boolean }) {
    const { data } = await api.post<ApiEnvelope<Category>>('/categories', payload);
    return data.data;
  },

  async updateCategory(id: string, payload: Partial<Category>) {
    const { data } = await api.put<ApiEnvelope<Category>>(`/categories/${id}`, payload);
    return data.data;
  },

  async deleteCategory(id: string) {
    const { data } = await api.delete<ApiEnvelope<null>>(`/categories/${id}`);
    return data;
  },

  async uploadImages(files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    const { data } = await api.post<ApiEnvelope<{ url: string; publicId: string | null }[]>>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 45000,
    });
    return data.data;
  },
};
