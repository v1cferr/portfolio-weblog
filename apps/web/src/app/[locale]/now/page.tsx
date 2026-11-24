import { cn } from "@workspace/ui/lib/utils";
import { ArrowRightIcon, ChevronRightIcon, CompassIcon, MapPinIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { PageTransition } from "@/components/page-transition";
import { SourceLink } from "@/components/source-link";
import { NowList } from "@/features/now/now-list";
import { NowStamp } from "@/features/now/now-stamp";
import { Link } from "@/i18n/navigation";
import { formatPartialDate } from "@/lib/dates";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { getNow, latestNow, writtenNow } from "@/lib/now";
import { datedPageJsonLd } from "@/lib/structured-data";

// "Last updated N days ago" is computed when the page renders; once a day is precise enough.
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Now");
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/now"),
    openGraph: { type: "website", ...pageOpenGraph(locale, "/now") },
  };
}

export default async function NowPage() {
  const locale = await getLocale();
  const t = await getTranslations("Now");
  const latest = latestNow(locale);
  const earlier = getNow().entries.slice(1);

  return (
    <PageTransition>
      {latest !== undefined && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              datedPageJsonLd(locale, { path: "/now", name: t("title"), description: t("description"), dateModified: latest.entry.date })
            ),
          }}
        />
      )}
      <PageHeader source={{ path: "now" }} icon={CompassIcon} title={t("title")} description={t("description")} />

      {latest === undefined ? (
        <EmptyState icon={CompassIcon} title={t("empty")} />
      ) : (
        <div className="max-w-3xl space-y-12">
          <article
            aria-labelledby="latest-update"
            data-stale={latest.age.stale || undefined}
            className={cn(
              "space-y-5 rounded-2xl border p-5 sm:p-7",
              latest.age.stale ? "border-dashed bg-transparent text-muted-foreground" : "glass"
            )}
          >
            <header className="space-y-1.5">
              <h2 id="latest-update" className="font-display text-2xl font-semibold tracking-tight">
                <time dateTime={latest.entry.date}>{formatPartialDate(latest.entry.date, locale)}</time>
              </h2>
              {latest.age.stale && <NowStamp date={latest.entry.date} age={latest.age} />}
            </header>
            {latest.note !== undefined && (
              <p className="text-lg text-pretty" lang={latest.note.locale}>
                {latest.note.value}
              </p>
            )}
            <NowList items={[...latest.written, ...latest.derived]} label={t("items")} className="text-lg" />
            <footer className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
              {latest.entry.place !== undefined && (
                <p className="flex items-center gap-1.5">
                  <MapPinIcon aria-hidden className="size-3.5" />
                  {t("place", { place: latest.entry.place })}
                </p>
              )}
              <p>{t("derived")}</p>
            </footer>
          </article>

          {earlier.length > 0 && (
            <section aria-labelledby="earlier">
              <SectionHeading id="earlier">{t("earlier")}</SectionHeading>
              <ol className="divide-y border-y">
                {earlier.map((entry) => {
                  const written = writtenNow(entry, locale);
                  return (
                    <li key={entry.date}>
                      <details className="group">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 py-3 font-mono text-sm tabular-nums [&::-webkit-details-marker]:hidden">
                          <ChevronRightIcon
                            aria-hidden
                            className="size-4 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
                          />
                          <time dateTime={entry.date}>{formatPartialDate(entry.date, locale)}</time>
                        </summary>
                        <div className="space-y-3 pb-5 pl-6">
                          {written.note !== undefined && (
                            <p className="text-pretty" lang={written.note.locale}>
                              {written.note.value}
                            </p>
                          )}
                          <NowList items={written.items} label={formatPartialDate(entry.date, locale)} />
                          {entry.place !== undefined && (
                            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPinIcon aria-hidden className="size-3.5" />
                              {t("place", { place: entry.place })}
                            </p>
                          )}
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <Link
            href="/next"
            className="group/link glass glass-hover flex min-h-11 items-center justify-between gap-3 rounded-xl border px-5 py-4 font-medium"
          >
            {t("next")}
            <ArrowRightIcon aria-hidden className="icon-fwd size-4 text-muted-foreground" />
          </Link>
        </div>
      )}

      <div className="mt-12">
        <SourceLink file={latest === undefined ? "now" : `now/${latest.entry.date}.yaml`} />
      </div>
    </PageTransition>
  );
}
