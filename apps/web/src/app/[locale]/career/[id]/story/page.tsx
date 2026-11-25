import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { NAV_BACK, PageTransition } from "@/components/page-transition";
import { FallbackNotice } from "@/components/fallback-notice";
import { SourceLink } from "@/components/source-link";
import { readingMinutes, renderMdx } from "@/features/weblog/mdx";
import { Link } from "@/i18n/navigation";
import { localeNames } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";
import { languageTag } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";

/**
 * Only jobs with a published story get this page; every other /career/<id>/story
 * is a 404. [id] has no layout, so this segment generates the id itself.
 */
export function generateStaticParams() {
  return getContent()
    .getStoryIds()
    .map((id) => ({ id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/career/[id]/story">): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const story = getContent().getStory(id, locale);
  if (story === undefined) return {};
  const path = `/career/${id}/story`;
  // hreflang only for real translations; a fallback page points its canonical at the original.
  const languages = Object.fromEntries(story.availableLocales.map((l) => [languageTag(l), `/${l}${path}`]));
  return {
    title: story.frontmatter.title,
    description: story.frontmatter.summary,
    alternates: { canonical: `/${story.locale}${path}`, languages },
    openGraph: {
      type: "article",
      ...pageOpenGraph(story.locale, path),
      title: story.frontmatter.title,
      description: story.frontmatter.summary,
      modifiedTime: story.frontmatter.updatedAt,
    },
  };
}

export default async function StoryPage({ params }: PageProps<"/[locale]/career/[id]/story">) {
  const { id } = await params;
  const locale = await getLocale();
  const [t, weblog, nav] = await Promise.all([getTranslations("Career"), getTranslations("Weblog"), getTranslations("Nav")]);
  const content = getContent();
  const story = content.getStory(id, locale);
  const experience = content.getExperience(id);
  if (story === undefined || experience === undefined) notFound();
  const organization = content.getOrganization(experience.organization);
  if (organization === undefined) notFound();
  const fm = story.frontmatter;
  const body = await renderMdx(story.body);
  const others = story.availableLocales.filter((l) => l !== story.locale);

  return (
    <PageTransition as="article">
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
            <BreadcrumbLink asChild>
              <Link href={`/career/${id}`} transitionTypes={NAV_BACK}>
                {organization.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("story")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-10 max-w-3xl space-y-4">
        <p className="font-mono text-xs tracking-wide text-lane-career uppercase">{organization.name}</p>
        <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl" lang={story.locale}>
          {fm.title}
        </h1>
        <p className="text-xl text-pretty text-muted-foreground" lang={story.locale}>
          {fm.summary}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{weblog("updated", { date: formatPartialDate(fm.updatedAt, locale) })}</span>
          <span className="font-mono text-xs">{readingMinutes(story.body)} min</span>
          {others.length > 0 && (
            <span className="text-xs">
              {weblog("availableIn")}{" "}
              {others.map((l) => (
                <a
                  key={l}
                  href={`/${l}/career/${id}/story`}
                  hrefLang={languageTag(l)}
                  lang={l}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {localeNames[l]}
                </a>
              ))}
            </span>
          )}
        </div>
      </header>

      {story.isFallback && <FallbackNotice requested={locale} actual={story.locale} />}

      <div className="prose-hub" lang={story.locale}>
        {body}
      </div>

      <footer className="mt-12 max-w-3xl space-y-6 border-t pt-8">
        <Link href={`/career/${id}`} transitionTypes={NAV_BACK} className="text-sm underline underline-offset-4 hover:text-lane-career">
          ← {t("backToJob", { organization: organization.name })}
        </Link>
        <SourceLink file={story.file} />
      </footer>
    </PageTransition>
  );
}
