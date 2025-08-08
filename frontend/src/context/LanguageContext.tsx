import React, { createContext, useContext, useEffect, useState } from 'react';

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
const TRANSLATION_VERSION = '1.0.9';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize language state from localStorage if available
  const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') as Language;
      return savedLang || 'en';
    }
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // On mount, clear other language caches and load cached translations if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear other language caches on app load (when user logs in)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('translations_') && !key.includes(`_${language}_v`)) {
          localStorage.removeItem(key);
        }
      });
      
      // Try to load cached translations
      const cacheKey = `translations_${language}_v${TRANSLATION_VERSION}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setTranslations(JSON.parse(cached));
          setIsLoaded(true);
          setIsInitialLoad(false);
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
    }
  }, [language]); // Re-run when language changes to handle cache invalidation

  useEffect(() => {
    const loadTranslations = async () => {
      // Check if we already have cached translations for this language
      if (typeof window !== 'undefined') {
        const cacheKey = `translations_${language}_v${TRANSLATION_VERSION}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const cachedTranslations = JSON.parse(cached);
            setTranslations(cachedTranslations);
            setIsLoaded(true);
            setIsInitialLoad(false);
            return; // Use cached version, no need to fetch
          } catch (e) {
            // If parsing fails, remove corrupted cache and continue to fetch
            localStorage.removeItem(cacheKey);
          }
        }
        // Clean up old version caches
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(`translations_${language}_v`) && key !== cacheKey) {
            localStorage.removeItem(key);
          }
        });
      }
      setIsLoaded(false);
      try {
        const res = await fetch(`/locales/${language}.json`);
        if (!res.ok) {
          throw new Error(`Failed to load translations: ${res.status}`);
        }
        const data = await res.json();
        setTranslations(data);
        // Cache translations in localStorage with version
        if (typeof window !== 'undefined') {
          const cacheKey = `translations_${language}_v${TRANSLATION_VERSION}`;
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
        // Add minimum loading time to prevent flickering only on initial load
        if (isInitialLoad) {
          await new Promise(resolve => setTimeout(resolve, 150));
          setIsInitialLoad(false);
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load translations:', error);
        setTranslations({});
        if (isInitialLoad) {
          await new Promise(resolve => setTimeout(resolve, 150));
          setIsInitialLoad(false);
        }
        setIsLoaded(true);
      }
    };
    
    // Always attempt to load translations when language changes
    loadTranslations();
  }, [language, isInitialLoad]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      // Clear other language caches when switching languages
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('translations_') && !key.includes(`_${lang}_v`)) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    let str = translations[key];
    
    // If translation not found, log it and return key
    if (!str) {
      //console.warn(`Translation missing for key: "${key}" in language: ${language}`);
      return key;
    }
    
    // Replace variables if provided
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    
    return str;
  };



  // Show loading screen while translations are loading (only on initial load or language change)
  if (!isLoaded && (isInitialLoad || Object.keys(translations).length === 0)) {
    return <LoadingScreen />;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded, clearTranslationCache: clearTranslationCache }}>
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
  if (typeof window !== 'undefined') {
    // Clear all translation caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('translations_')) {
        localStorage.removeItem(key);
      }
    });
  }
};