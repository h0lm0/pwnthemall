import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isLoaded: boolean;
  clearTranslationCache: () => void;
}

// Simple loading component
const LoadingScreen = () => (
  <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
    <div className="flex flex-col items-center space-y-6">
      {/* Spinner */}
      <div className="relative">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted"></div>
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent absolute inset-0"></div>
      </div>
      
      {/* Loading text */}
      <div className="text-sm text-muted-foreground font-medium">
        Loading...
      </div>
    </div>
  </div>
);

const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isLoaded: false,
  clearTranslationCache: () => {},
});

// Translation cache version - increment this when you update translations
const TRANSLATION_VERSION = '1.0.12';

// Flatten nested object into dot notation keys
// Supports both nested (auth.login) and flat (login) key access
// e.g., { auth: { login: "Login" } } -> { "auth.login": "Login", "login": "Login" }
const storeTranslationValue = (flattened: Record<string, string>, newKey: string, key: string, value: any, prefix: string) => {
  flattened[newKey] = String(value);
  if (prefix && !flattened[key]) {
    flattened[key] = String(value);
  }
};

const flattenTranslations = (obj: any, prefix = ''): Record<string, string> => {
  const flattened: Record<string, string> = {};
  
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
    
    if (isObject) {
      Object.assign(flattened, flattenTranslations(value, newKey));
    } else {
      storeTranslationValue(flattened, newKey, key, value, prefix);
    }
  }
  
  return flattened;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize language state from localStorage if available
  const getInitialLanguage = (): Language => {
    if (globalThis.window !== undefined) {
      const savedLang = localStorage.getItem('language') as Language;
      return savedLang || 'en';
    }
    return 'en';
  };

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // On mount, clear other language caches and load cached translations if available
  useEffect(() => {
    if (globalThis.window !== undefined) {
      // Clear other language caches on app load (when user logs in)
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('translations_') && !key.includes(`_${language}_v`)) {
          localStorage.removeItem(key);
        }
      }
      
      // Try to load cached translations
      const cacheKey = `translations_${language}_v${TRANSLATION_VERSION}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setTranslations(JSON.parse(cached));
          setIsLoaded(true);
          setIsInitialLoad(false);
        } catch (e) {
          console.error('Failed to parse cached translations:', e);
          localStorage.removeItem(cacheKey);
        }
      }
    }
  }, [language]); // Re-run when language changes to handle cache invalidation

  const tryLoadCachedTranslations = (cacheKey: string) => {
    if (globalThis.window === undefined) return false;
    
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return false;
    
    try {
      const cachedTranslations = JSON.parse(cached);
      setTranslations(cachedTranslations);
      setIsLoaded(true);
      setIsInitialLoad(false);
      return true;
    } catch (e) {
      console.error('Failed to parse cached translations:', e);
      localStorage.removeItem(cacheKey);
      return false;
    }
  };

  const cleanupOldCaches = (cacheKey: string) => {
    if (globalThis.window === undefined) return;
    
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(`translations_${language}_v`) && key !== cacheKey) {
        localStorage.removeItem(key);
      }
    }
  };

  const cacheTranslations = (data: Record<string, string>) => {
    if (globalThis.window === undefined) return;
    
    const cacheKey = `translations_${language}_v${TRANSLATION_VERSION}`;
    localStorage.setItem(cacheKey, JSON.stringify(data));
  };

  const handleLoadingDelay = async () => {
    if (isInitialLoad) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    const loadTranslations = async () => {
      const cacheKey = `translations_${language}_v${TRANSLATION_VERSION}`;
      
      if (tryLoadCachedTranslations(cacheKey)) {
        return;
      }
      
      cleanupOldCaches(cacheKey);
      setIsLoaded(false);
      
      try {
        const res = await fetch(`/locales/${language}.json`);
        if (!res.ok) {
          throw new Error(`Failed to load translations: ${res.status}`);
        }
        const data = await res.json();
        const flattenedData = flattenTranslations(data);
        
        setTranslations(flattenedData);
        cacheTranslations(flattenedData);
        await handleLoadingDelay();
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load translations:', error);
        setTranslations({});
        await handleLoadingDelay();
        setIsLoaded(true);
      }
    };
    
    loadTranslations();
  }, [language, isInitialLoad]);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    if (globalThis.window !== undefined) {
      localStorage.setItem('language', lang);
      // Clear other language caches when switching languages
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('translations_') && !key.includes(`_${lang}_v`)) {
          localStorage.removeItem(key);
        }
      }
    }
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    let str = translations[key];
    
    // If translation not found, return key
    if (!str) {
      return key;
    }
    
    // Replace variables if provided
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    
    return str;
  }, [translations]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t,
    isLoaded,
    clearTranslationCache
  }), [language, handleSetLanguage, t, isLoaded]);

  // Show loading screen while translations are loading (only on initial load or language change)
  if (!isLoaded && (isInitialLoad || Object.keys(translations).length === 0)) {
    return <LoadingScreen />;
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      <div className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {children}
        {/* Subtle loading indicator for language changes */}
        {!isLoaded && !isInitialLoad && (
          <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        )}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

// Export clearTranslationCache function for use in other contexts
export const clearTranslationCache = () => {
  if (globalThis.window !== undefined) {
    // Clear all translation caches
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('translations_')) {
        localStorage.removeItem(key);
      }
    }
  }
};