import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { LanguagesIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { type Locale, localeNames } from "@/i18n/routing";

/**
 * Shown when the requested locale has no reviewed text and another locale is
 * served instead (docs/architecture/i18n.md). Never silently machine-translate.
 */
export async function FallbackNotice({ requested, actual }: { requested: Locale; actual: Locale }) {
  const t = await getTranslations("Common");
  return (
    <Alert className="mb-8">
      <LanguagesIcon />
      <AlertDescription>{t("fallbackNotice", { requested: localeNames[requested], actual: localeNames[actual] })}</AlertDescription>
    </Alert>
  );
}
