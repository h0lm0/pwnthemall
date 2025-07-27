import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { Config } from '@/models/Config';

interface SiteConfigContextType {
  siteConfig: Record<string, string>;
  loading: boolean;
  refreshConfig: () => void;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [siteConfig, setSiteConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await axios.get<Config[]>('/api/public-configs');
      const configMap: Record<string, string> = {};
      response.data.forEach(config => {
        configMap[config.key] = config.value;
      });
      setSiteConfig(configMap);
    } catch (error) {
      console.error('Failed to fetch site configuration:', error);
      // Set default values if config fetch fails
      setSiteConfig({
        SITE_NAME: 'pwnthemall',
        FLAG_PREFIX: 'PTA{',
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = () => {
    setLoading(true);
    fetchConfig();
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <SiteConfigContext.Provider value={{ siteConfig, loading, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
} 