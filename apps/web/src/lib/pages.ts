import "server-only";

import { findPage, loadPages, type PageSource } from "@workspace/content";

import type { Locale } from "@/i18n/routing";

import { CONTENT_ROOT } from "./content";

let pages: PageSource[] | undefined;

/** The public prose pages (content/pages); rebuilt on every call in development, like the registry. */
function getPages(): PageSource[] {
  if (process.env.NODE_ENV === "development") return loadPages(CONTENT_ROOT);
  pages ??= loadPages(CONTENT_ROOT);
  return pages;
}

/** One page in this locale, or the English text flagged as a fallback. */
export function getPage(slug: string, locale: Locale) {
  return findPage(getPages(), slug, locale);
}
