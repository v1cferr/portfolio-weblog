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
