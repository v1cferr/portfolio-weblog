import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

type Messages = Record<string, unknown>;

function isPlainObject(value: unknown): value is Messages {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fills keys missing from `partial` with the default locale's strings. */
function withFallback(fallback: Messages, partial: Messages): Messages {
  const merged: Messages = { ...fallback };
  for (const [key, value] of Object.entries(partial)) {
    const base = merged[key];
    merged[key] = isPlainObject(base) && isPlainObject(value) ? withFallback(base, value) : value;
  }
  return merged;
}

async function loadMessages(locale: string): Promise<Messages> {
  return ((await import(`../../messages/${locale}.json`)) as { default: Messages }).default;
}

export default getRequestConfig(async ({ locale: explicit }) => {
  // Route handlers cannot read root params, so they pass the locale explicitly
  // (e.g. getTranslations({ locale, namespace })).
  const requested = explicit ?? (await rootParams.locale());
  if (!hasLocale(routing.locales, requested)) notFound();
  const locale = requested;

  // UI strings without a reviewed translation fall back to English instead of
  // being machine-translated (docs/architecture/i18n.md).
  const fallback = await loadMessages(routing.defaultLocale);
  const messages = locale === routing.defaultLocale ? fallback : withFallback(fallback, await loadMessages(locale));

  return { locale, messages, timeZone: "UTC" };
});
