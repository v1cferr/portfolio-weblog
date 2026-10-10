import { defineRouting } from "next-intl/routing";

/**
 * Same locales, default and URL prefixes as v1, so every /{locale}/... link
 * published before v2 keeps resolving.
 */
export const routing = defineRouting({
  locales: ["en-us", "pt-br", "zh-cn"],
  defaultLocale: "en-us",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

/** Locale names written in their own language, for the switcher and notices. */
export const localeNames: Record<Locale, string> = {
  "en-us": "English",
  "pt-br": "Português",
  "zh-cn": "中文",
};

/**
 * Locales with reviewed editorial content. Others (zh-cn today) show the
 * English text with one site-wide notice instead of a notice per block.
 */
export const editorialLocales: readonly Locale[] = ["en-us", "pt-br"];
