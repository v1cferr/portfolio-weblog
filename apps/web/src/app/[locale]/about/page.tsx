import { localize, localizeList } from "@workspace/content";
import { ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { FallbackNotice } from "@/components/fallback-notice";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { SourceLink } from "@/components/source-link";
import { Trajectory } from "@/features/profile/trajectory";
import { getContent } from "@/lib/content";
import { pageAlternates } from "@/lib/i18n";
import { personJsonLd } from "@/lib/structured-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("About");
  return { title: t("title"), description: t("description"), alternates: pageAlternates(locale, "/about") };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getTranslations("About");
  const profile = getContent().getProfile();
  const about = localizeList(profile.about, locale);
  const focus = localizeList(profile.focus, locale);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(locale)) }} />
      <PageHeader eyebrow="content/profile/profile.yaml" title={t("title")} description={localize(profile.headline, locale).value} />

      {about?.isFallback === true && <FallbackNotice requested={locale} actual={about.locale} />}

      <div className="grid gap-14 lg:grid-cols-[minmax(0,42rem)_1fr]">
        <div className="space-y-5 font-serif text-lg leading-relaxed" lang={about?.locale}>
          {about?.value.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <aside className="space-y-10">
          {focus !== undefined && (
            <section aria-labelledby="focus">
              <h2 id="focus" className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                {t("focus")}
              </h2>
              <ul className="space-y-2" lang={focus.locale}>
                {focus.value.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="elsewhere">
            <h2 id="elsewhere" className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {t("elsewhere")}
            </h2>
            <ul className="space-y-1.5">
              {profile.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    rel={link.kind === "profile" ? "me" : undefined}
                    className="inline-flex items-center gap-1.5 hover:text-lane-career"
                  >
                    {link.label}
                    <ExternalLinkIcon className="size-3.5 text-muted-foreground" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {profile.trajectory.length > 0 && (
        <section aria-labelledby="trajectory" className="mt-16">
          <SectionHeading id="trajectory">{t("trajectory")}</SectionHeading>
          <Trajectory steps={profile.trajectory} label={t("trajectory")} />
        </section>
      )}

      {profile.quotes.length > 0 && (
        <section aria-labelledby="quotes" className="mt-16 max-w-3xl">
          <SectionHeading id="quotes">{t("quotes")}</SectionHeading>
          <ul className="space-y-6">
            {profile.quotes.map((quote) => (
              <li key={quote.text}>
                <figure className="border-l-2 border-lane-writing/50 pl-4">
                  <blockquote lang={quote.locale} className="font-serif text-lg italic">
                    {quote.text}
                  </blockquote>
                  <figcaption className="mt-1 text-sm text-muted-foreground">
                    {quote.url !== undefined ? (
                      <a href={quote.url} className="hover:text-foreground">
                        — {quote.source}
                      </a>
                    ) : (
                      `— ${quote.source}`
                    )}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-12">
        <SourceLink file="profile/profile.yaml" />
      </div>
    </>
  );
}
