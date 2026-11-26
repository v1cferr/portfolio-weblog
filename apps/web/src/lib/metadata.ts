import "server-only";

import { getTranslations } from "next-intl/server";

import { type Locale, routing } from "@/i18n/routing";

import { getContent } from "./content";
import { languageTag } from "./i18n";
import { getNow } from "./now";

export const SITE_NAME = "v1cferr.dev";

/**
 * The id of the one card every opengraph-image route returns from
 * generateImageMetadata, so a card lives at <route>/opengraph-image/card.
 */
export const OG_IMAGE_ID = "card";

/** Alt text of the site card, app/[locale]/opengraph-image.tsx, in the page's language. */
export async function siteImageAlt(locale: Locale): Promise<string> {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return t("siteImageAlt");
}

/** og:locale wants an underscore ("pt-br" → "pt_BR"). */
export function openGraphLocale(locale: string): string {
  return languageTag(locale).replace("-", "_");
}

/**
 * The Open Graph fields every page shares: its URL, the site name and the
 * locale. A page's `openGraph` replaces its parent's whole object, images
 * included. Next.js adds the card of a page with an opengraph-image of its
 * own; a page without one asks for the site card with siteOpenGraphImages().
 */
export function pageOpenGraph(locale: Locale, path: string) {
  const suffix = path === "/" ? "" : path;
  return {
    siteName: SITE_NAME,
    locale: openGraphLocale(locale),
    url: `/${locale}${suffix}`,
  };
}

/** The site card, for a page without an opengraph-image of its own (the tag pages). */
export async function siteOpenGraphImages(locale: Locale) {
  return [
    {
      url: `/${locale}/opengraph-image/${OG_IMAGE_ID}`,
      width: 1200,
      height: 630,
      type: "image/png",
      alt: await siteImageAlt(locale),
    },
  ];
}

/** The owner's X handle ("@v1cferr"), read from the profile links; undefined when there is none. */
export function xHandle(): string | undefined {
  for (const link of getContent().getProfile().links) {
    const match = /^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/?$/.exec(link.url);
    if (match?.[1] !== undefined) return `@${match[1]}`;
  }
  return undefined;
}

/**
 * The date the site last changed: the newest now-log entry or post date.
 * Link previews (LinkedIn's above all) otherwise guess a "published" date
 * from the first <time> on the page, which on the home is a 2025
 * recommendation. Posts declare their own date instead.
 */
export function siteUpdatedAt(): string | undefined {
  const content = getContent();
  const dates = content.getPostSlugs().flatMap((slug) => {
    const fm = content.getPost(slug, routing.defaultLocale)?.frontmatter;
    return [fm?.updatedAt, fm?.publishedAt].filter((date): date is string => date !== undefined);
  });
  const latest = getNow().entries[0];
  if (latest !== undefined) dates.push(latest.date);
  return dates.sort().at(-1);
}

/**
 * The date LinkedIn's link preview reads (publish_date / og:publish_date).
 */
export function publishDateMeta(date: string | undefined): Record<string, string> {
  return date === undefined ? {} : { publish_date: date, "og:publish_date": date };
}
