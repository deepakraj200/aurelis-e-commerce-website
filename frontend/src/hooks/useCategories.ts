import { useEffect, useState } from 'react';
import type { Category } from '@/types';
import { productService } from '@/services/productService';

let cache: Category[] = [];

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>(cache);

  useEffect(() => {
    if (cache.length) {
      setCategories(cache);
      return;
    }
    let active = true;
    productService
      .categories()
      .then((data) => {
        cache = data;
        if (active) setCategories(data);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return categories;
};
