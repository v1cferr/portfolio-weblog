import { DEFAULT_LOCALE, LOCALES, type Locale, type LocalizedList, type LocalizedText } from "./schemas";

export interface Resolved<T> {
  value: T;
  /** Locale the value is actually written in. */
  locale: Locale;
  /** True when the requested locale had no text and another one was used. */
  isFallback: boolean;
}

/** Requested locale first, then English, then the remaining locales in declaration order. */
export function fallbackChain(locale: Locale): Locale[] {
  return [locale, DEFAULT_LOCALE, ...LOCALES].filter((value, index, all) => all.indexOf(value) === index);
}

export function localize(text: LocalizedText, locale: Locale): Resolved<string> {
  for (const candidate of fallbackChain(locale)) {
    const value = text[candidate];
    if (value !== undefined) return { value, locale: candidate, isFallback: candidate !== locale };
  }
  // The schema guarantees at least one locale.
  throw new Error("LocalizedText without any locale");
}

/** Like `localize`, for lists; returns undefined when no locale has entries. */
export function localizeList(list: LocalizedList | undefined, locale: Locale): Resolved<string[]> | undefined {
  if (list === undefined) return undefined;
  for (const candidate of fallbackChain(locale)) {
    const value = list[candidate];
    if (value !== undefined && value.length > 0) return { value, locale: candidate, isFallback: candidate !== locale };
  }
  return undefined;
}
