import { BookTextIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { FallbackNotice } from "@/components/fallback-notice";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { SourceLink } from "@/components/source-link";
import { renderMdx } from "@/features/weblog/mdx";
import { formatPartialDate } from "@/lib/dates";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { getPage } from "@/lib/pages";
import { datedPageJsonLd } from "@/lib/structured-data";

/*
 * How this site is built: a colophon in prose (content/pages/colophon), in the
 * spirit of the IndieWeb's colophons, with the date it was last tended.
 */

const SLUG = "colophon";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Colophon");
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/colophon"),
    openGraph: { type: "website", ...pageOpenGraph(locale, "/colophon") },
  };
}

export default async function ColophonPage() {
  const locale = await getLocale();
  const t = await getTranslations("Colophon");
  const page = getPage(SLUG, locale);
  if (page === undefined) notFound();
  const body = await renderMdx(page.body);
  const { title, summary, updatedAt } = page.frontmatter;

  return (
    <PageTransition>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            datedPageJsonLd(locale, { path: "/colophon", name: title, description: summary, dateModified: updatedAt })
          ),
        }}
      />
      <PageHeader source={{ path: "pages/colophon" }} icon={BookTextIcon} title={title} description={summary}>
        <p className="font-mono text-xs text-muted-foreground">
          {t("updated")} <time dateTime={updatedAt}>{formatPartialDate(updatedAt, locale)}</time>
        </p>
      </PageHeader>

      {page.isFallback && <FallbackNotice requested={locale} actual={page.locale} />}

      <div className="prose-hub" lang={page.locale}>
        {body}
      </div>

      <div className="mt-12 max-w-3xl border-t pt-8">
        <SourceLink file={page.file} />
      </div>
    </PageTransition>
  );
}
