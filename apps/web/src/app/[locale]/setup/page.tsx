import { localize } from "@workspace/content";
import { ExternalLinkIcon, MonitorIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { FallbackNotice } from "@/components/fallback-notice";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { RailTimeline } from "@/components/rail-timeline";
import { SourceLink } from "@/components/source-link";
import { SetupCopyButton } from "@/features/setup/copy-button";
import { getContent } from "@/lib/content";
import { formatMonthRange, formatPartialDate, newestFirst } from "@/lib/dates";
import { pageAlternates } from "@/lib/i18n";
import { setupToMarkdown } from "@/lib/setup-markdown";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Setup");
  return { title: t("title"), description: t("description"), alternates: pageAlternates(locale, "/setup") };
}

export default async function SetupPage() {
  const locale = await getLocale();
  const t = await getTranslations("Setup");
  const setup = getContent().getSetup();
  if (setup === undefined) notFound();

  const firstTitle = setup.groups[0] && localize(setup.groups[0].title, locale);

  return (
    <>
      <PageHeader eyebrow="content/profile/setup.yaml" icon={MonitorIcon} title={t("title")} description={t("description")}>
        <div className="flex flex-wrap items-center gap-4">
          <p className="font-mono text-xs text-muted-foreground">{t("updated", { date: formatPartialDate(setup.updatedAt, locale) })}</p>
          <SetupCopyButton markdown={setupToMarkdown(setup, locale, t("markdownHeading"))} label={t("copy")} done={t("copied")} />
        </div>
      </PageHeader>

      {firstTitle?.isFallback === true && <FallbackNotice requested={locale} actual={firstTitle.locale} />}

      <div className="space-y-14">
        {setup.groups.map((group) => {
          const title = localize(group.title, locale);
          return (
            <section key={group.id} aria-labelledby={`setup-${group.id}`}>
              <SectionHeading id={`setup-${group.id}`}>
                <span lang={title.locale}>{title.value}</span>
              </SectionHeading>
              {group.items.some((item) => item.until !== undefined) ? (
                // Retired parts are dated: a newest-first timeline, by retirement date.
                <RailTimeline
                  lane="project"
                  nodeClassName="top-5"
                  gapClassName="space-y-3"
                  entries={newestFirst(group.items, (item) => ({ start: item.since, end: item.until })).map((item) => {
                    const role = localize(item.role, locale);
                    const note = item.note && localize(item.note, locale);
                    return {
                      key: `${item.model}${item.since ?? ""}`,
                      node: item.until === undefined ? "current" : "past",
                      children: (
                        <article className="glass space-y-1 rounded-xl border px-4 py-3">
                          <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <span className="text-sm text-muted-foreground" lang={role.locale}>
                              {role.value}
                            </span>
                            {item.since !== undefined && (
                              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                {formatMonthRange(item.since, item.until, locale, t("present"))}
                              </span>
                            )}
                          </p>
                          <p className="font-medium">
                            {item.url !== undefined ? (
                              <a href={item.url} className="inline-flex items-start gap-1.5 hover:text-lane-project">
                                {item.model}
                                <ExternalLinkIcon className="mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden />
                              </a>
                            ) : (
                              item.model
                            )}
                          </p>
                          {note && (
                            <p className="max-w-3xl text-sm text-pretty text-muted-foreground" lang={note.locale}>
                              {note.value}
                            </p>
                          )}
                        </article>
                      ),
                    };
                  })}
                />
              ) : (
                <dl className="divide-y border-y">
                  {group.items.map((item) => {
                    const role = localize(item.role, locale);
                    const note = item.note && localize(item.note, locale);
                    return (
                      <div key={`${item.model}${item.since ?? ""}`} className="grid gap-1 py-3 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-6">
                        <dt className="text-sm text-muted-foreground" lang={role.locale}>
                          {role.value}
                        </dt>
                        <dd className="space-y-1">
                          {item.url !== undefined ? (
                            <a href={item.url} className="inline-flex items-start gap-1.5 hover:text-lane-project">
                              {item.model}
                              <ExternalLinkIcon className="mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden />
                            </a>
                          ) : (
                            <span>{item.model}</span>
                          )}
                          {item.since !== undefined && (
                            <p className="font-mono text-xs text-muted-foreground">
                              {item.until !== undefined
                                ? t("period", { start: formatPartialDate(item.since, locale), end: formatPartialDate(item.until, locale) })
                                : t("since", { date: formatPartialDate(item.since, locale) })}
                            </p>
                          )}
                          {note && (
                            <p className="max-w-3xl text-sm text-muted-foreground" lang={note.locale}>
                              {note.value}
                            </p>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              )}
            </section>
          );
        })}
      </div>
      {setup.photos.length > 0 && (
        <section aria-labelledby="setup-photos" className="mt-14">
          <SectionHeading id="setup-photos">{t("photos")}</SectionHeading>
          <RailTimeline
            lane="project"
            nodeClassName="top-5"
            gapClassName="space-y-4"
            entries={newestFirst(setup.photos, (photo) => ({ start: photo.date, end: photo.date })).map((photo) => {
              const alt = localize(photo.alt, locale);
              const caption = photo.caption && localize(photo.caption, locale);
              return {
                key: photo.src,
                node: "past",
                children: (
                  <figure className="glass grid gap-4 overflow-hidden rounded-xl border p-3 sm:grid-cols-[18rem_minmax(0,1fr)] sm:p-4">
                    <a href={photo.src} className="relative block aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={photo.src}
                        alt={alt.value}
                        fill
                        sizes="(min-width: 640px) 288px, 100vw"
                        className="object-cover transition-transform hover:scale-[1.02]"
                      />
                    </a>
                    <figcaption className="space-y-1.5 self-center">
                      <time dateTime={photo.date} className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatPartialDate(photo.date, locale)}
                      </time>
                      {caption && (
                        <p className="text-pretty" lang={caption.locale}>
                          {caption.value}
                        </p>
                      )}
                    </figcaption>
                  </figure>
                ),
              };
            })}
          />
        </section>
      )}

      <div className="mt-12">
        <SourceLink file="profile/setup.yaml" />
      </div>
    </>
  );
}
