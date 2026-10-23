import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

/** BCP 47 tag for Intl and the html lang attribute ("pt-br" → "pt-BR"). */
export function languageTag(locale: string): string {
  const [language, region] = locale.split("-");
  return region === undefined ? (language ?? locale) : `${language ?? ""}-${region.toUpperCase()}`;
}

/** hreflang map for a path that exists in every locale. */
export function languageAlternates(path: string): Record<string, string> {
  const suffix = path === "/" ? "" : path;
  const map: Record<string, string> = {};
  for (const locale of routing.locales) map[languageTag(locale)] = `/${locale}${suffix}`;
  map["x-default"] = `/${routing.defaultLocale}${suffix}`;
  return map;
}

export function pageAlternates(locale: Locale, path: string) {
  const suffix = path === "/" ? "" : path;
  return { canonical: `/${locale}${suffix}`, languages: languageAlternates(path) };
}
