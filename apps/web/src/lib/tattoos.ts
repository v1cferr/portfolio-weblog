import "server-only";

import { loadTattoos, localize, localizeList, type Tattoos } from "@workspace/content";
import type { SearchDocument } from "@workspace/search";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";

import { CONTENT_ROOT } from "./content";
import { SHOWS_REVIEW } from "./preview";

let tattoos: Tattoos | undefined;
let loaded = false;

/**
 * The /tattoos content, or undefined while it is hidden (a draft, or in review
 * outside a preview deployment). Rebuilt on every call in development, like the
 * registry.
 */
export function getTattoos(): Tattoos | undefined {
  if (process.env.NODE_ENV === "development") return loadTattoos(CONTENT_ROOT, { includeReview: SHOWS_REVIEW });
  if (!loaded) {
    tattoos = loadTattoos(CONTENT_ROOT, { includeReview: SHOWS_REVIEW });
    loaded = true;
  }
  return tattoos;
}

/** One search document per tattoo or idea, pointing at its card; none while the page is hidden. */
export async function tattooSearchDocuments(locale: Locale): Promise<SearchDocument[]> {
  const page = getTattoos();
  if (page === undefined) return [];
  const t = await getTranslations({ locale, namespace: "Tattoos" });
  return page.tattoos.map((tattoo) => {
    const title = localize(tattoo.title, locale);
    const meaning = localize(tattoo.meaning, locale);
    return {
      id: `page:tattoos-${tattoo.id}:${locale}`,
      entityId: tattoo.id,
      type: "page",
      locale: title.locale,
      section: "tattoos",
      title: `${title.value} · ${t("title")}`,
      keywords: [
        localize(tattoo.origin, locale).value,
        ...(tattoo.values === undefined ? [] : (localizeList(tattoo.values, locale)?.value ?? [])),
      ].join(" \n"),
      text: [meaning.value, ...(localizeList(tattoo.body, locale)?.value ?? []), ...tattoo.quotes.map((quote) => quote.text)].join(" \n"),
      excerpt: meaning.value,
      url: `/${locale}/tattoos#${tattoo.id}`,
    };
  });
}
