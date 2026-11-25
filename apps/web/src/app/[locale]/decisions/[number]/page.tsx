import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb";
import { localize } from "@workspace/content";
import { ExternalLinkIcon, FolderGit2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ExternalLink } from "@/components/external-link";
import { FallbackNotice } from "@/components/fallback-notice";
import { GITHUB_MARK, Icon } from "@/components/icon";
import { Morph } from "@/components/morph";
import { NAV_BACK, PageTransition } from "@/components/page-transition";
import { DecisionMeta } from "@/features/decisions/decision-meta";
import { renderMdx } from "@/features/weblog/mdx";
import { Link } from "@/i18n/navigation";
import { repositoryFileUrl, rewriteDecisionLinks } from "@/lib/decision-links";
import { getDecision, getDecisions } from "@/lib/decisions";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph, siteOpenGraphImages } from "@/lib/metadata";

/** The records are written in English only. */
const RECORD_LOCALE = "en-us";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDecisions().map((decision) => ({ number: decision.number }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/decisions/[number]">): Promise<Metadata> {
  const { number } = await params;
  const locale = await getLocale();
  const decision = getDecision(number);
  if (decision === undefined) return {};
  const t = await getTranslations("Decisions");
  const title = `${t("number", { number })}: ${decision.title}`;
  const description = decision.why === undefined ? undefined : localize(decision.why, locale).value;
  return {
    title,
    description,
    alternates: pageAlternates(locale, `/decisions/${number}`),
    openGraph: {
      type: "article",
      ...pageOpenGraph(locale, `/decisions/${number}`),
      title,
      description,
      publishedTime: decision.date,
      images: await siteOpenGraphImages(locale),
    },
  };
}

/** One architecture decision record, rendered from docs/decisions/ as it is written. */
export default async function DecisionPage({ params }: PageProps<"/[locale]/decisions/[number]">) {
  const { number } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Decisions");
  const decision = getDecision(number);
  if (decision === undefined) notFound();
  const why = decision.why === undefined ? undefined : localize(decision.why, locale);
  const body = await renderMdx(rewriteDecisionLinks(decision.body), { format: "md" });
  const github = repositoryFileUrl(decision.file);

  return (
    <PageTransition as="article">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/decisions" transitionTypes={NAV_BACK}>
                {t("title")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-mono">{decision.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-10 max-w-3xl space-y-4">
        <DecisionMeta decision={decision} />
        <Morph kind="decision" id={decision.number}>
          <h1
            className="w-fit font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-5xl"
            lang={RECORD_LOCALE}
          >
            {decision.title}
          </h1>
        </Morph>
        {why !== undefined && (
          <section aria-labelledby="why" className="glass space-y-1.5 rounded-2xl border p-5">
            <h2 id="why" className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {t("why")}
            </h2>
            <p className="text-lg text-pretty" lang={why.locale}>
              {why.value}
            </p>
          </section>
        )}
        <ExternalLink
          href={github}
          className="group/link inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <Icon icon={GITHUB_MARK} fallback={FolderGit2Icon} className="icon-lift" />
          {t("viewOnGitHub")}
          <ExternalLinkIcon aria-hidden className="icon-out size-3.5" />
        </ExternalLink>
      </header>

      {locale !== RECORD_LOCALE && <FallbackNotice requested={locale} actual={RECORD_LOCALE} />}

      <div className="prose-hub [&_code]:[overflow-wrap:anywhere] [&_a]:[overflow-wrap:anywhere]" lang={RECORD_LOCALE}>
        {body}
      </div>
    </PageTransition>
  );
}
