import "server-only";

import { localize } from "@workspace/content";

import type { Locale } from "@/i18n/routing";

import { getContent } from "./content";
import { absoluteUrl, SITE_URL } from "./site";

/** schema.org Person built from the profile; only public profile fields. */
export function personJsonLd(locale: Locale) {
  const profile = getContent().getProfile();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    alternateName: profile.handle,
    url: SITE_URL,
    jobTitle: localize(profile.headline, locale).value,
    description: localize(profile.summary, locale).value,
    ...(profile.photo !== undefined && { image: absoluteUrl(profile.photo) }),
    ...(profile.location !== undefined && { homeLocation: { "@type": "Place", name: profile.location } }),
    sameAs: profile.links.filter((link) => link.kind === "profile").map((link) => link.url),
  };
}
