'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language } from '@/types';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (mr: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('mr');

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'mr' ? 'en' : 'mr'));
  }, []);

  const t = useCallback(
    (mr: string, en: string) => (language === 'mr' ? mr : en),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
