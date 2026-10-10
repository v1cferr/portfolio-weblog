import { localize } from "@workspace/content";
import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { FallbackNotice } from "@/components/fallback-notice";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { SourceLink } from "@/components/source-link";
import { getContent } from "@/lib/content";
import { formatPartialDate } from "@/lib/dates";
import { pageAlternates } from "@/lib/i18n";

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
      <PageHeader eyebrow="content/profile/setup.yaml" title={t("title")} description={t("description")}>
        <p className="font-mono text-xs text-muted-foreground">{t("updated", { date: formatPartialDate(setup.updatedAt, locale) })}</p>
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
            </section>
          );
        })}
      </div>
      <div className="mt-12">
        <SourceLink file="profile/setup.yaml" />
      </div>
    </>
  );
}
