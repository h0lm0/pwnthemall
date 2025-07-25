import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  isLoaded: false,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('language') as Language) || 'en';
    }
    return 'en';
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    fetch(`/locales/${language}.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load translations: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        //console.log(`Loaded ${Object.keys(data).length} translations for ${language}`);
        setTranslations(data);
        setIsLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load translations:', error);
        setTranslations({});
        setIsLoaded(true); // Still set to true to avoid infinite loading
      });
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    // If translations aren't loaded yet, return the key
    if (!isLoaded) {
      return key;
    }
    
    let str = translations[key];
    
    // If translation not found, log it and return key
    if (!str) {
      console.warn(`Translation missing for key: "${key}" in language: ${language}`);
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

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext); 