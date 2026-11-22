import "server-only";

import type { Locale } from "@/i18n/routing";

import { getContent } from "./content";
import { languageTag } from "./i18n";

export const SITE_NAME = "v1cferr.dev";

/** Alt text of the site card, app/[locale]/opengraph-image.tsx. */
export const SITE_IMAGE_ALT = "Victor Ferreira (v1cferr), personal hub at v1cferr.dev";

/** og:locale wants an underscore ("pt-br" → "pt_BR"). */
export function openGraphLocale(locale: string): string {
  return languageTag(locale).replace("-", "_");
}

/**
 * The Open Graph fields every page shares: its URL, the site name and the
 * locale. A page's `openGraph` replaces its parent's whole object, images
 * included, so a page without an opengraph-image of its own asks for the site
 * card here (`siteImage`); the pages that have one leave it out and Next.js
 * adds theirs.
 */
export function pageOpenGraph(locale: Locale, path: string, { siteImage = true }: { siteImage?: boolean } = {}) {
  const suffix = path === "/" ? "" : path;
  return {
    siteName: SITE_NAME,
    locale: openGraphLocale(locale),
    url: `/${locale}${suffix}`,
    ...(siteImage && {
      images: [
        {
          url: `/${locale}/opengraph-image`,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: SITE_IMAGE_ALT,
        },
      ],
    }),
  };
}

/** The owner's X handle ("@v1cferr"), read from the profile links; undefined when there is none. */
export function xHandle(): string | undefined {
  for (const link of getContent().getProfile().links) {
    const match = /^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/?$/.exec(link.url);
    if (match?.[1] !== undefined) return `@${match[1]}`;
  }
  return undefined;
}
