import { useCallback, useEffect, useRef, useState } from 'react';
import type { PaginationMeta, Product, ProductListParams } from '@/types';
import { productService } from '@/services/productService';
import { getErrorMessage } from '@/services/api';

const defaultMeta: PaginationMeta = { page: 1, pages: 0, total: 0, limit: 12 };

export const useProducts = (params: ProductListParams = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const requestId = useRef(0);
  const key = JSON.stringify(params);

  useEffect(() => {
    const current = requestId.current + 1;
    requestId.current = current;
    setLoading(true);
    setError(null);

    productService
      .list(JSON.parse(key) as ProductListParams)
      .then((result) => {
        if (requestId.current !== current) return;
        setProducts(result.data);
        setMeta(result.meta);
      })
      .catch((err) => {
        if (requestId.current !== current) return;
        setError(getErrorMessage(err));
        setProducts([]);
      })
      .finally(() => {
        if (requestId.current === current) setLoading(false);
      });
  }, [key, version]);

  const refetch = useCallback(() => setVersion((value) => value + 1), []);

  return { products, meta, loading, error, refetch };
};
