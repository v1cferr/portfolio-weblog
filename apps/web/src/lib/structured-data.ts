import "server-only";

import { localize } from "@workspace/content";

import type { Locale } from "@/i18n/routing";

import { getContent } from "./content";
import { currentRole } from "./current-role";
import { languageTag } from "./i18n";
import { absoluteUrl, SITE_URL } from "./site";

/** Stable node ids, so every page's JSON-LD points at the same person and site. */
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** The name with the handle in quotes after the first name: Victor "v1cferr" Ferreira. */
export function signature(name: string, handle: string): string {
  const [first, ...rest] = name.split(" ");
  return rest.length === 0 ? `${name} "${handle}"` : `${first ?? name} "${handle}" ${rest.join(" ")}`;
}

/**
 * schema.org Person built from the profile and the career; only public fields.
 * alternateName carries the name with the handle in quotes, as the owner
 * signs it (Victor "v1cferr" Ferreira), the handle and the aliases (Google
 * reads real names from `name` and handles from `alternateName`), sameAs every
 * public profile,
 * and knowsAbout the technologies of the roles still open.
 */
export function personJsonLd(locale: Locale) {
  const content = getContent();
  const profile = content.getProfile();
  const role = currentRole(locale);
  const knowsAbout = [
    ...new Set(
      content
        .getExperiences()
        .filter((experience) => experience.positions.at(-1)?.end === undefined)
        .flatMap((experience) => experience.technologies)
        .map((id) => content.getTechnology(id)?.name)
        .filter((name) => name !== undefined)
    ),
  ];
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: profile.name,
    alternateName: [signature(profile.name, profile.handle), profile.handle, ...profile.aliases],
    url: SITE_URL,
    jobTitle: role?.title ?? localize(profile.headline, locale).value,
    ...(role !== undefined && {
      worksFor: {
        "@type": "Organization",
        name: role.organization.name,
        ...(role.organization.url !== undefined && { url: role.organization.url }),
      },
    }),
    description: localize(profile.summary, locale).value,
    ...(profile.photo !== undefined && { image: absoluteUrl(profile.photo) }),
    ...(profile.location !== undefined && { homeLocation: { "@type": "Place", name: profile.location } }),
    ...(knowsAbout.length > 0 && { knowsAbout }),
    sameAs: profile.links.filter((link) => link.kind === "profile").map((link) => link.url),
  };
}

/**
 * The site itself, for Google's site name: `name` is the preferred name and
 * alternateName the fallbacks in order (handle, aliases, domain). It belongs on
 * the home page only.
 */
export function websiteJsonLd(locale: Locale) {
  const profile = getContent().getProfile();
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: profile.name,
    alternateName: [profile.handle, ...profile.aliases, new URL(SITE_URL).hostname],
    url: SITE_URL,
    inLanguage: languageTag(locale),
    publisher: { "@id": PERSON_ID },
  };
}

/** The home page: the site and the person it is about, as one graph. */
export function homeJsonLd(locale: Locale) {
  return { "@context": "https://schema.org", "@graph": [websiteJsonLd(locale), personJsonLd(locale)] };
}

/**
 * A page about the person that changes over time (/now, /next): its
 * dateModified is the date the page shows, so machines and readers agree.
 */
export function datedPageJsonLd(
  locale: Locale,
  { path, name, description, dateModified }: { path: string; name: string; description: string; dateModified: string }
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: absoluteUrl(`/${locale}${path}`),
    name,
    description,
    inLanguage: languageTag(locale),
    dateModified,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
  };
}

/** The About page is a profile page in Google's sense: its main entity is the person. */
export function profilePageJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(`/${locale}/about`),
    inLanguage: languageTag(locale),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: personJsonLd(locale),
  };
}
