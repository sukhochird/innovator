"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  getDictionary,
  isValidLocale,
  type Locale,
  type TranslationDict,
} from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  t: TranslationDict;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

let localeListeners: Array<() => void> = [];
let cachedLocale: Locale = DEFAULT_LOCALE;

function readLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && isValidLocale(stored)) return stored;
  return DEFAULT_LOCALE;
}

function subscribeLocale(cb: () => void) {
  localeListeners.push(cb);
  return () => {
    localeListeners = localeListeners.filter((l) => l !== cb);
  };
}

function getLocaleSnapshot(): Locale {
  if (typeof window === "undefined") return cachedLocale;
  cachedLocale = readLocale();
  return cachedLocale;
}

function setStoredLocale(locale: Locale) {
  cachedLocale = locale;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  localeListeners.forEach((l) => l());
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, () => DEFAULT_LOCALE);

  const setLocale = useCallback((next: Locale) => {
    setStoredLocale(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      t: getDictionary(locale),
      setLocale,
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
