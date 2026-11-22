import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { type Messages, withFallback } from "./messages";
import { routing } from "./routing";

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
