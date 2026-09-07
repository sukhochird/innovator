import mn from "./mn";
import en from "./en";
import type { Locale, TranslationDict } from "./types";

export type { Locale, TranslationDict };

const dictionaries: Record<Locale, TranslationDict> = { mn, en };

export const DEFAULT_LOCALE: Locale = "mn";
export const LOCALE_STORAGE_KEY = "carq-locale";

export function getDictionary(locale: Locale): TranslationDict {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function isValidLocale(value: string): value is Locale {
  return value === "mn" || value === "en";
}
