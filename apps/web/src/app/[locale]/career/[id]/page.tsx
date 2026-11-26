import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
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
import { BookOpenTextIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { AnchorHeading } from "@/components/anchor/anchor-heading";
import { NAV_BACK, PageTransition } from "@/components/page-transition";
import { DateRange } from "@/components/date-range";
import { FallbackNotice } from "@/components/fallback-notice";
import { ContentLinkIcon } from "@/components/icon";
import { MediaGallery } from "@/components/media-gallery";
import { Morph } from "@/components/morph";
import { RelatedContent } from "@/components/related-content";
import { SourceLink } from "@/components/source-link";
import { SourceList } from "@/components/source-list";
import { ProjectCard } from "@/features/projects/project-card";
import { TechList } from "@/components/tech-list";
import { OrganizationMark } from "@/features/career/organization-mark";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { anchorId } from "@/lib/anchors";
import { getContent } from "@/lib/content";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { ExternalLink } from "@/components/external-link";

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
    // The card comes from opengraph-image.tsx in this segment.
    openGraph: { type: "website", ...pageOpenGraph(locale, `/career/${id}`) },
  };
}

function ListSection({ id, title, list, locale }: { id: string; title: string; list: LocalizedList; locale: Locale }): ReactNode {
  const items = localizeList(list, locale);
  if (items === undefined) return null;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <AnchorHeading id={id} className="text-xl font-semibold">
        {title}
      </AnchorHeading>
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
  // Projects made in this job, declared on either side (experience.projects or project.experiences).
  const projects = [...new Set(content.getRelatedContent(id).flatMap((ref) => (ref.type === "project" ? [ref.id] : [])))].flatMap(
    (projectId) => content.getProject(projectId) ?? []
  );
  const fallback = texts.find((text) => text.isFallback);
  const story = content.getStory(id, locale);

  return (
    <PageTransition as="article" className="max-w-3xl">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/career" transitionTypes={NAV_BACK}>
                {nav("career")}
              </Link>
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
            <Morph kind="experience" id={experience.id}>
              <h1 className="w-fit font-display text-4xl font-semibold tracking-tight md:text-5xl">{organization.name}</h1>
            </Morph>
            {organization.url !== undefined && (
              <ExternalLink
                href={organization.url}
                className="group/link inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {new URL(organization.url).hostname.replace(/^www\./, "")}
                <ExternalLinkIcon className="icon-out size-3" aria-hidden />
              </ExternalLink>
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
              {(position.location ?? experience.location) !== undefined && (
                <span className="text-sm text-muted-foreground">{position.location ?? experience.location}</span>
              )}
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
        {story !== undefined && (
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={`/career/${id}/story`}>
              <BookOpenTextIcon aria-hidden />
              {t("readStory")}
            </Link>
          </Button>
        )}
        <SourceLink file={content.getSourceFile(id)} />
      </header>

      {fallback !== undefined && <FallbackNotice requested={locale} actual={fallback.locale} />}

      <div className="mb-10">
        <MediaGallery id={experience.id} media={experience.media} />
      </div>

      <div className="space-y-10">
        {context && (
          <section aria-labelledby="context" className="space-y-3">
            <AnchorHeading id="context" className="text-xl font-semibold">
              {t("context")}
            </AnchorHeading>
            <p lang={context.locale}>{context.value}</p>
          </section>
        )}
        <ListSection id="responsibilities" title={t("responsibilities")} list={experience.responsibilities} locale={locale} />
        {[...experience.positions]
          .reverse()
          .map((position) =>
            position.responsibilities === undefined ? null : (
              <ListSection
                key={`responsibilities-${position.start ?? ""}`}
                id={anchorId("responsibilities", position.start ?? localize(position.title, "en-us").value)}
                title={t("positionResponsibilities", { title: localize(position.title, locale).value })}
                list={position.responsibilities}
                locale={locale}
              />
            )
          )}
        <ListSection id="contributions" title={t("contributions")} list={experience.contributions} locale={locale} />
        <ListSection id="learnings" title={t("learnings")} list={experience.learnings} locale={locale} />
        {hindsight && (
          <section aria-labelledby="hindsight" className="space-y-3">
            <AnchorHeading id="hindsight" className="text-xl font-semibold">
              {t("hindsight")}
            </AnchorHeading>
            <p lang={hindsight.locale}>{hindsight.value}</p>
          </section>
        )}
        {impact && (
          <section aria-labelledby="impact" className="space-y-3">
            <AnchorHeading id="impact" className="text-xl font-semibold">
              {t("impact")}
            </AnchorHeading>
            <p lang={impact.locale}>{impact.value}</p>
          </section>
        )}

        {projects.length > 0 && (
          <section aria-labelledby="projects-here" className="space-y-3">
            <AnchorHeading id="projects-here" className="text-xl font-semibold">
              {t("projectsHere")}
            </AnchorHeading>
            <ul className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {experience.technologies.length > 0 && (
          <section aria-labelledby="technologies" className="space-y-3">
            <AnchorHeading id="technologies" className="text-xl font-semibold">
              {common("technologies")}
            </AnchorHeading>
            <TechList ids={experience.technologies} label={common("technologies")} />
          </section>
        )}

        {experience.evidence.length > 0 && (
          <section aria-labelledby="evidence" className="space-y-3">
            <AnchorHeading id="evidence" className="text-xl font-semibold">
              {common("evidence")}
            </AnchorHeading>
            <ul className="space-y-1">
              {experience.evidence.map((link) => (
                <li key={link.url}>
                  <ExternalLink
                    href={link.url}
                    className="group/link inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-lane-career"
                  >
                    <ContentLinkIcon link={link} />
                    {link.label}
                    <ExternalLinkIcon className="icon-out size-3.5" aria-hidden />
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </section>
        )}
        <SourceList sources={experience.sources} />
      </div>

      <Separator className="my-12" />
      <RelatedContent id={id} exclude={["project"]} />
    </PageTransition>
  );
}
