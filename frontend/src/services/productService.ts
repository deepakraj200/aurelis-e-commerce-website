import api from './api';
import type {
  ApiEnvelope,
  ApiList,
  Category,
  Product,
  ProductListParams,
  Review,
  ReviewDistribution,
} from '@/types';

const clean = (params: Record<string, unknown>) =>
  Object.entries(params).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') acc[key] = value;
    return acc;
  }, {});

export const productService = {
  async list(params: ProductListParams = {}): Promise<ApiList<Product>> {
    const { data } = await api.get<ApiEnvelope<Product[]>>('/products', { params: clean(params as Record<string, unknown>) });
    return { data: data.data, meta: data.meta || { page: 1, pages: 1, total: data.data.length, limit: data.data.length } };
  },

  async get(idOrSlug: string) {
    const { data } = await api.get<ApiEnvelope<{ product: Product; reviewSummary: { _id: number; count: number }[] }>>(
      `/products/${idOrSlug}`
    );
    return data.data;
  },

  async related(id: string) {
    const { data } = await api.get<ApiEnvelope<Product[]>>(`/products/${id}/related`);
    return data.data;
  },

  async filters() {
    const { data } = await api.get<ApiEnvelope<{ categories: Category[]; priceRange: { min: number; max: number } }>>(
      '/products/filters'
    );
    return data.data;
  },

  async categories(): Promise<Category[]> {
    const { data } = await api.get<ApiEnvelope<Category[]>>('/categories');
    return data.data;
  },

  async reviews(productId: string, page = 1, limit = 6) {
    const { data } = await api.get<ApiEnvelope<Review[]>>(`/products/${productId}/reviews`, {
      params: { page, limit },
    });
    const distribution = (data.meta as unknown as { distribution?: ReviewDistribution; average?: number }) || {};
    return {
      reviews: data.data,
      meta: data.meta,
      distribution: distribution.distribution || {},
      average: distribution.average || 0,
    };
  },

  async createReview(payload: { productId: string; rating: number; title?: string; comment: string }) {
    const { data } = await api.post<ApiEnvelope<Review>>('/reviews', payload);
    return data.data;
  },
};
