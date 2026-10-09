import { Badge } from "@workspace/ui/components/badge";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { PartialDate } from "@/components/date-range";
import { FallbackNotice } from "@/components/fallback-notice";
import { RelatedContent } from "@/components/related-content";
import { SourceLink } from "@/components/source-link";
import { TechList } from "@/components/tech-list";
import { readingMinutes, renderMdx } from "@/features/weblog/mdx";
import { Link } from "@/i18n/navigation";
import { localeNames } from "@/i18n/routing";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";
import { languageTag } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getContent()
    .getPostSlugs()
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/weblog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getContent().getPost(slug, locale);
  if (post === undefined) return {};
  // hreflang only for real translations; a fallback page points its canonical at the original.
  const languages = Object.fromEntries(post.availableLocales.map((l) => [languageTag(l), `/${l}/weblog/${slug}`]));
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.summary,
    alternates: { canonical: `/${post.locale}/weblog/${slug}`, languages },
    openGraph: {
      type: "article",
      title: post.frontmatter.title,
      description: post.frontmatter.summary,
      ...(post.frontmatter.publishedAt !== undefined && { publishedTime: post.frontmatter.publishedAt }),
      ...(post.frontmatter.updatedAt !== undefined && { modifiedTime: post.frontmatter.updatedAt }),
      tags: post.frontmatter.tags,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/[locale]/weblog/[slug]">) {
  const { slug } = await params;
  const locale = await getLocale();
  const [t, common, nav] = await Promise.all([getTranslations("Weblog"), getTranslations("Common"), getTranslations("Nav")]);
  const post = getContent().getPost(slug, locale);
  if (post === undefined) notFound();
  const fm = post.frontmatter;
  const body = await renderMdx(post.body);
  const others = post.availableLocales.filter((l) => l !== post.locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: fm.title,
    description: fm.summary,
    inLanguage: languageTag(post.locale),
    datePublished: fm.publishedAt,
    dateModified: fm.updatedAt ?? fm.publishedAt,
    url: absoluteUrl(`/${post.locale}/weblog/${slug}`),
    author: { "@type": "Person", name: getContent().getProfile().name, url: absoluteUrl("/") },
    keywords: fm.tags.join(", "),
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mb-10 max-w-3xl space-y-4">
        <Link href="/weblog" className="font-mono text-xs text-muted-foreground hover:text-foreground">
          ← {nav("weblog")}
        </Link>
        <p className="font-mono text-xs tracking-wide text-lane-writing uppercase">{t(`category.${fm.category}`)}</p>
        <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl" lang={post.locale}>
          {fm.title}
        </h1>
        <p className="text-xl text-pretty text-muted-foreground" lang={post.locale}>
          {fm.summary}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {fm.publishedAt !== undefined && <PartialDate date={fm.publishedAt} />}
          {fm.updatedAt !== undefined && (
            <span className="font-mono text-xs">{t("updated", { date: formatPartialDate(fm.updatedAt, locale) })}</span>
          )}
          <span className="font-mono text-xs">{readingMinutes(post.body)} min</span>
          {others.length > 0 && (
            <span className="text-xs">
              {t("availableIn")}{" "}
              {others.map((l) => (
                <a
                  key={l}
                  href={`/${l}/weblog/${slug}`}
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

      {post.isFallback && <FallbackNotice requested={locale} actual={post.locale} />}

      <div className="prose-hub" lang={post.locale}>
        {body}
      </div>

      <footer className="mt-12 max-w-3xl space-y-6 border-t pt-8">
        {fm.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("tags")}>
            {fm.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="secondary" asChild className="font-mono font-normal">
                  <Link href={`/weblog/tags/${tag}`}>#{tag}</Link>
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <TechList ids={fm.technologies} label={common("technologies")} />
        <SourceLink file={post.file} />
      </footer>

      <RelatedContent id={slug} />
    </article>
  );
}
