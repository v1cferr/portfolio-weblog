import { localize, localizeList } from "@workspace/content";
import { ArrowLeftIcon, MilestoneIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { SourceLink } from "@/components/source-link";
import { NowStamp } from "@/features/now/now-stamp";
import { Link } from "@/i18n/navigation";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { getNow } from "@/lib/now";
import { datedPageJsonLd } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Next");
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/next"),
    openGraph: { type: "website", ...pageOpenGraph(locale, "/next") },
  };
}

export default async function NextPage() {
  const locale = await getLocale();
  const t = await getTranslations("Next");
  const next = getNow().next;
  const items = next === undefined ? undefined : localizeList(next.items, locale);
  const note = next?.note === undefined ? undefined : localize(next.note, locale);

  return (
    <PageTransition>
      {next !== undefined && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              datedPageJsonLd(locale, { path: "/next", name: t("title"), description: t("description"), dateModified: next.updatedAt })
            ),
          }}
        />
      )}
      <PageHeader source={{ path: "now/next.yaml", name: "next" }} icon={MilestoneIcon} title={t("title")} description={t("description")} />

      {next === undefined || items === undefined ? (
        <EmptyState icon={MilestoneIcon} title={t("empty")} />
      ) : (
        <div className="max-w-3xl space-y-12">
          <section aria-labelledby="plans" className="glass space-y-5 rounded-2xl border p-5 sm:p-7">
            <header className="space-y-1.5">
              <h2 id="plans" className="font-display text-2xl font-semibold tracking-tight">
                {t("items")}
              </h2>
              <NowStamp date={next.updatedAt} namespace="Next" />
            </header>
            {note !== undefined && (
              <p className="text-lg text-pretty" lang={note.locale}>
                {note.value}
              </p>
            )}
            <ol className="space-y-3 text-lg" lang={items.locale}>
              {items.value.map((item, index) => (
                <li key={item} className="flex gap-3 leading-relaxed text-pretty">
                  <span aria-hidden className="mt-[0.35em] font-mono text-xs text-lane-project tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>

          <Link
            href="/now"
            className="group/link glass glass-hover flex min-h-11 items-center gap-3 rounded-xl border px-5 py-4 font-medium"
          >
            <ArrowLeftIcon aria-hidden className="icon-back size-4 text-muted-foreground" />
            {t("now")}
          </Link>
        </div>
      )}

      <div className="mt-12">
        <SourceLink file="now/next.yaml" />
      </div>
    </PageTransition>
  );
}
