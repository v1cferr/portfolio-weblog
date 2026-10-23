import "server-only";

import { compareDesc, localize } from "@workspace/content";

import type { Locale } from "@/i18n/routing";

import { getContent } from "./content";
import { absoluteUrl, SITE_URL } from "./site";

/**
 * The latest current position at an employer (freelance work is not an
 * employer), derived from the career so it changes with the next job.
 */
function currentRole(locale: Locale) {
  const content = getContent();
  const current = content
    .getExperiences()
    .flatMap((experience) => {
      const organization = content.getOrganization(experience.organization);
      if (organization === undefined || organization.kind === "self-employed") return [];
      return experience.positions
        .filter((position) => position.start !== undefined && position.end === undefined)
        .map((position) => ({ organization, title: localize(position.title, locale).value, start: position.start ?? "" }));
    })
    .sort((a, b) => compareDesc(a.start, b.start));
  return current[0];
}

/** schema.org Person built from the profile and the career; only public fields. */
export function personJsonLd(locale: Locale) {
  const profile = getContent().getProfile();
  const role = currentRole(locale);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    alternateName: profile.handle,
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
    sameAs: profile.links.filter((link) => link.kind === "profile").map((link) => link.url),
  };
}
