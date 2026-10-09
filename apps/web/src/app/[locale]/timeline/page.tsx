import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { CommitGraph, LaneLegend } from "@/features/timeline/commit-graph";
import { getContent } from "@/lib/content";
import { getRepoIndex } from "@/lib/github";
import { pageAlternates } from "@/lib/i18n";

// Projects without a start date fall back to their repository's creation
// date, which comes from GitHub and is refreshed daily.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Timeline");
  return { title: t("title"), description: t("description"), alternates: pageAlternates(locale, "/timeline") };
}

export default async function TimelinePage() {
  const t = await getTranslations("Timeline");
  const index = await getRepoIndex();
  const events = getContent().getUnifiedTimeline({
    repositoryCreatedAt: (repository) => (index.ok ? index.get(repository)?.created_at : undefined),
  });
  return (
    <>
      <PageHeader eyebrow="derived from content/*" title={t("title")} description={t("description")}>
        <LaneLegend />
      </PageHeader>
      {events.length === 0 ? <p className="text-muted-foreground">{t("empty")}</p> : <CommitGraph events={events} label={t("title")} />}
    </>
  );
}
