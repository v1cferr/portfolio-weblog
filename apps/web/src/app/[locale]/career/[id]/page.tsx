import { Badge } from "@workspace/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { Separator } from "@workspace/ui/components/separator";
import { localize, localizeList, type LocalizedList, type Resolved } from "@workspace/content";
import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { DateRange } from "@/components/date-range";
import { FallbackNotice } from "@/components/fallback-notice";
import { RelatedContent } from "@/components/related-content";
import { SourceLink } from "@/components/source-link";
import { TechList } from "@/components/tech-list";
import { OrganizationMark } from "@/features/career/organization-mark";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { pageAlternates } from "@/lib/i18n";

export function generateStaticParams() {
  return getContent()
    .getExperiences()
    .map((experience) => ({ id: experience.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/career/[id]">): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const content = getContent();
  const experience = content.getExperience(id);
  if (experience === undefined) return {};
  const org = content.getOrganization(experience.organization)?.name ?? id;
  const title = localize(experience.positions.at(-1)?.title ?? experience.summary, locale).value;
  return {
    title: `${title} · ${org}`,
    description: localize(experience.summary, locale).value,
    alternates: pageAlternates(locale, `/career/${id}`),
  };
}

function ListSection({ title, list, locale }: { title: string; list: LocalizedList; locale: Locale }): ReactNode {
  const items = localizeList(list, locale);
  if (items === undefined) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <ul className="list-disc space-y-1.5 pl-5 marker:text-lane-career">
        {items.value.map((item) => (
          <li key={item} lang={items.locale}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ExperiencePage({ params }: PageProps<"/[locale]/career/[id]">) {
  const { id } = await params;
  const locale = await getLocale();
  const [t, common, nav] = await Promise.all([getTranslations("Career"), getTranslations("Common"), getTranslations("Nav")]);
  const content = getContent();
  const experience = content.getExperience(id);
  if (experience === undefined) notFound();
  const organization = content.getOrganization(experience.organization);
  if (organization === undefined) notFound();

  const summary = localize(experience.summary, locale);
  const texts: Resolved<string>[] = [summary];
  const context = experience.context && localize(experience.context, locale);
  const hindsight = experience.hindsight && localize(experience.hindsight, locale);
  const impact = experience.impact && localize(experience.impact, locale);
  for (const text of [context, hindsight, impact]) if (text) texts.push(text);
  const fallback = texts.find((text) => text.isFallback);

  return (
    <article className="max-w-3xl">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/career">{nav("career")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{organization.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-10 space-y-5">
        <div className="flex items-center gap-4">
          <OrganizationMark organization={organization} size="lg" />
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">{organization.name}</h1>
            {organization.url !== undefined && (
              <a href={organization.url} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                {new URL(organization.url).hostname.replace(/^www\./, "")}
                <ExternalLinkIcon className="size-3" aria-hidden />
              </a>
            )}
          </div>
        </div>
        <ol aria-label={t("positions")} className="space-y-2 border-l-2 border-lane-career/40 pl-4">
          {[...experience.positions].reverse().map((position) => (
            <li key={`${position.start ?? ""}${localize(position.title, "en-us").value}`} className="flex flex-col gap-0.5">
              <span className="text-lg font-medium">
                {localize(position.title, locale).value}
                {position.employmentType !== undefined && (
                  <Badge variant="secondary" className="ml-2 align-middle font-normal">
                    {t(`employmentType.${position.employmentType}`)}
                  </Badge>
                )}
              </span>
              {position.start !== undefined && <DateRange start={position.start} end={position.end} showDuration />}
              {position.note !== undefined && (
                <span className="text-sm text-muted-foreground" lang={localize(position.note, locale).locale}>
                  {localize(position.note, locale).value}
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="text-xl text-pretty" lang={summary.locale}>
          {summary.value}
        </p>
        <SourceLink file={content.getSourceFile(id)} />
      </header>

      {fallback !== undefined && <FallbackNotice requested={locale} actual={fallback.locale} />}

      <div className="space-y-10">
        {context && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">{t("context")}</h2>
            <p lang={context.locale}>{context.value}</p>
          </section>
        )}
        <ListSection title={t("responsibilities")} list={experience.responsibilities} locale={locale} />
        {[...experience.positions]
          .reverse()
          .map((position) =>
            position.responsibilities === undefined ? null : (
              <ListSection
                key={`responsibilities-${position.start ?? ""}`}
                title={t("positionResponsibilities", { title: localize(position.title, locale).value })}
                list={position.responsibilities}
                locale={locale}
              />
            )
          )}
        <ListSection title={t("contributions")} list={experience.contributions} locale={locale} />
        <ListSection title={t("learnings")} list={experience.learnings} locale={locale} />
        {hindsight && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">{t("hindsight")}</h2>
            <p lang={hindsight.locale}>{hindsight.value}</p>
          </section>
        )}
        {impact && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">{t("impact")}</h2>
            <p lang={impact.locale}>{impact.value}</p>
          </section>
        )}

        {experience.technologies.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">{common("technologies")}</h2>
            <TechList ids={experience.technologies} label={common("technologies")} />
          </section>
        )}

        {experience.evidence.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-semibold">{common("evidence")}</h2>
            <ul className="space-y-1">
              {experience.evidence.map((link) => (
                <li key={link.url}>
                  <a href={link.url} className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-lane-career">
                    {link.label}
                    <ExternalLinkIcon className="size-3.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <Separator className="my-12" />
      <RelatedContent id={id} />
    </article>
  );
}
