import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Locale } from '../locales';
import type { TranslationKeys } from '../locales/en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number, decimals?: number) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'timeledger_locale';

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return (saved === 'de' || saved === 'en') ? saved : 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  };

  const formatCurrency = (value: number): string => {
    const t = translations[locale];
    const formatted = formatNumber(value, 2);
    return `${formatted} ${t.formatting.currencySymbol}`;
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    const t = translations[locale];
    const fixed = value.toFixed(decimals);
    const [integer, decimal] = fixed.split('.');

    // Add thousands separator
    const withThousands = integer.replace(/\B(?=(\d{3})+(?!\d))/g, t.formatting.thousandsSeparator);

    // Combine with decimal separator
    if (decimal) {
      return `${withThousands}${t.formatting.decimalSeparator}${decimal}`;
    }
    return withThousands;
  };

  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale],
    formatCurrency,
    formatNumber,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
