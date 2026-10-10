import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { LanguagesIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { editorialLocales, type Locale, localeNames } from "@/i18n/routing";

/**
 * Shown when the requested locale has no reviewed text and another locale is
 * served instead (docs/architecture/i18n.md). Never silently machine-translate.
 */
export async function FallbackNotice({ requested, actual }: { requested: Locale; actual: Locale }) {
  // Without editorial content the site-wide notice already says this.
  if (!editorialLocales.includes(requested)) return null;
  const t = await getTranslations("Common");
  return (
    <Alert className="mb-8">
      <LanguagesIcon />
      <AlertDescription>{t("fallbackNotice", { requested: localeNames[requested], actual: localeNames[actual] })}</AlertDescription>
    </Alert>
  );
}

/** One notice for the whole site when the locale has no editorial content at all. */
export async function SiteLanguageNotice({ locale }: { locale: Locale }) {
  if (editorialLocales.includes(locale)) return null;
  const t = await getTranslations("Common");
  return (
    <div className="border-b bg-muted/60">
      <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm text-muted-foreground sm:px-6">
        <LanguagesIcon className="size-4 shrink-0" aria-hidden />
        {t("siteFallbackNotice", { requested: localeNames[locale], actual: localeNames["en-us"] })}
      </p>
    </div>
  );
}
