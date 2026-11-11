import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RuntimeConfig } from '@/types';
import { miscService } from '@/services/miscService';
import { FALLBACK_CONFIG } from '@/utils/constants';

const ConfigContext = createContext<RuntimeConfig>(FALLBACK_CONFIG as RuntimeConfig);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<RuntimeConfig>(FALLBACK_CONFIG as RuntimeConfig);

  useEffect(() => {
    let active = true;
    miscService
      .config()
      .then((data) => {
        if (active) setConfig(data);
      })
      .catch(() => {
        /* Fallback configuration keeps the storefront usable. */
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => config, [config]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => useContext(ConfigContext);
