import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

export const AuthBootstrap = () => {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return null;
};
