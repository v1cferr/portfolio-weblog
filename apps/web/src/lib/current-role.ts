import "server-only";

import { compareDesc, localize, type Resolved } from "@workspace/content";

import type { Locale } from "@/i18n/routing";

import { getContent } from "./content";

/**
 * The latest current position at an employer (freelance work is not an
 * employer), derived from the career so it changes with the next job.
 */
export function currentRole(locale: Locale) {
  const content = getContent();
  const current = content
    .getExperiences()
    .flatMap((experience) => {
      const organization = content.getOrganization(experience.organization);
      if (organization === undefined || organization.kind === "self-employed") return [];
      return experience.positions
        .filter((position) => position.start !== undefined && position.end === undefined)
        .map((position) => {
          const title = localize(position.title, locale);
          return { organization, title: title.value, titleLocale: title.locale, start: position.start ?? "" };
        });
    })
    .sort((a, b) => compareDesc(a.start, b.start));
  return current[0];
}

/**
 * The owner's title as the site shows it (hero, share card, About): the
 * current role's title, without the employer, so it follows the career on
 * its own. The profile headline is only the fallback for when no role is
 * open.
 */
export function ownerTitle(locale: Locale): Resolved<string> {
  const role = currentRole(locale);
  if (role !== undefined) return { value: role.title, locale: role.titleLocale, isFallback: role.titleLocale !== locale };
  return localize(getContent().getProfile().headline, locale);
}
