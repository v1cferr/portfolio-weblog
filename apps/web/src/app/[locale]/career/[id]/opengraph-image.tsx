import { localize } from "@workspace/content";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { editorialLocales, routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";
import { ogImageAlt, ogImageMetadata, ogLocale, renderOgImage } from "@/lib/og-image";
import { storePath } from "@/lib/store-path";

export async function generateImageMetadata({ params }: { params: { locale: string; id: string } }) {
  const locale = ogLocale(params.locale);
  const content = getContent();
  const experience = content.getExperience(params.id);
  if (experience === undefined) return [];
  const title = localize(experience.positions.at(-1)?.title ?? experience.summary, locale).value;
  const org = content.getOrganization(experience.organization)?.name ?? params.id;
  // The page's own title, "<position> · <organization>".
  return ogImageMetadata(await ogImageAlt(locale, `${title} · ${org}`));
}

/** An experience's share card: the latest position, the organization and the period. */
export default async function ExperienceImage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: requested, id } = await params;
  const locale = ogLocale(requested);
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
