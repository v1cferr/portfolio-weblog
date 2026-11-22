import { localize } from "@workspace/content";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { editorialLocales, routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";
import { renderOgImage } from "@/lib/og-image";
import { storePath } from "@/lib/store-path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Career entry of Victor Ferreira on v1cferr.dev";

export const dynamicParams = false;

// A route handler sits outside the [locale] layout, so it lists the locale too.
export function generateStaticParams() {
  const ids = getContent()
    .getExperiences()
    .map((experience) => experience.id);
  return routing.locales.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

/** An experience's share card: the latest position, the organization and the period. */
export default async function ExperienceImage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: requested, id } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const content = getContent();
  const experience = content.getExperience(id);
  if (experience === undefined) notFound();
  const [kind, common] = await Promise.all([
    getTranslations({ locale, namespace: "Kind" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  // Dates in an editorial language: the card's fonts carry no CJK glyphs.
  const dateLocale = editorialLocales.includes(locale) ? locale : routing.defaultLocale;
  const first = experience.positions[0];
  const latest = experience.positions.at(-1);
  const start = first?.start === undefined ? undefined : formatPartialDate(first.start, dateLocale);
  const end = latest?.end === undefined ? common("present") : formatPartialDate(latest.end, dateLocale);
  return renderOgImage({
    storePath: storePath(`experiences/${id}.yaml`).label,
    title: localize(latest?.title ?? experience.summary, locale).value,
    subtitle: content.getOrganization(experience.organization)?.name ?? id,
    meta: start === undefined ? undefined : `${start} – ${end}`,
    section: kind("experience"),
    lane: "career",
    command: `open /career/${id}`,
  });
}
