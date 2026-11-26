import { localize, localizeList } from "@workspace/content";
import {
  ArrowRightIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CompassIcon,
  ExternalLinkIcon,
  LanguagesIcon,
  LayersIcon,
  ListChecksIcon,
  MessageSquareQuoteIcon,
  PenLineIcon,
  SparklesIcon,
  UserRoundIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/page-transition";
import { FallbackNotice } from "@/components/fallback-notice";
import { ContentLinkIcon } from "@/components/icon";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { SourceLink } from "@/components/source-link";
import { TechList } from "@/components/tech-list";
import { Avatar } from "@/features/profile/avatar";
import { AboutNumbers } from "@/features/profile/about-numbers";
import { Credentials } from "@/features/profile/credentials";
import { Curiosities } from "@/features/profile/curiosities";
import { RecommendationCard } from "@/features/profile/recommendations";
import { Trajectory } from "@/features/profile/trajectory";
import { Volunteering } from "@/features/profile/volunteering";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { ownerTitle } from "@/lib/current-role";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { profilePageJsonLd } from "@/lib/structured-data";
import { ExternalLink } from "@/components/external-link";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("About");
  const profile = getContent().getProfile();
  const [firstName, ...lastNames] = profile.name.split(" ");
  return {
    title: t("title"),
    description: t("description"),
    alternates: pageAlternates(locale, "/about"),
    openGraph: {
      type: "profile",
      ...pageOpenGraph(locale, "/about"),
      ...(firstName !== undefined && { firstName }),
      ...(lastNames.length > 0 && { lastName: lastNames.join(" ") }),
      username: profile.handle,
    },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const [t, common, recs] = await Promise.all([getTranslations("About"), getTranslations("Common"), getTranslations("Recommendations")]);
  const content = getContent();
  const profile = content.getProfile();
  const about = localizeList(profile.about, locale);
  const focus = localizeList(profile.focus, locale);
  const motivation = localizeList(profile.motivation, locale);
  const principles = localizeList(profile.principles, locale);
  const studying = localizeList(profile.studying, locale);

  // "Now" and "Current stack" come from content, never from prose: the roles
  // still open, their technologies, and the newest post in this language.
  const current = content
    .getExperiences()
    .filter((experience) => experience.positions.at(-1)?.end === undefined)
    .map((experience) => ({
      experience,
      title: localize(experience.positions.at(-1)?.title ?? experience.summary, locale),
      organization: content.getOrganization(experience.organization)?.name,
    }));
  const stack = [...new Set(current.flatMap(({ experience }) => experience.technologies))];
  const latestPost = content.getPosts(locale)[0];
  const recommendations = content.getRecommendations();

  return (
    <PageTransition>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd(locale)) }} />
      <PageHeader
        source={{ path: "profile/profile.yaml", name: "profile" }}
        icon={UserRoundIcon}
        title={t("title")}
        description={ownerTitle(locale).value}
      />

      {about?.isFallback === true && <FallbackNotice requested={locale} actual={about.locale} />}

      <div className="grid gap-14 lg:grid-cols-[minmax(0,42rem)_1fr]">
        <div className="space-y-14">
          <div className="space-y-5 text-lg leading-relaxed" lang={about?.locale}>
            {about?.value.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {stack.length > 0 && (
            <section aria-labelledby="stack">
              <SectionHeading id="stack" icon={LayersIcon} info={t("stackNote")}>
                {t("stack")}
              </SectionHeading>
              <TechList ids={stack} label={common("technologies")} />
            </section>
          )}

          {motivation !== undefined && (
            <section aria-labelledby="motivation">
              <SectionHeading id="motivation" icon={SparklesIcon}>
                {t("motivation")}
              </SectionHeading>
              <div className="space-y-5 text-lg leading-relaxed" lang={motivation.locale}>
                {motivation.value.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {principles !== undefined && (
            <section aria-labelledby="principles">
              <SectionHeading id="principles" icon={ListChecksIcon}>
                {t("principles")}
              </SectionHeading>
              <ol className="grid gap-3 sm:grid-cols-2" lang={principles.locale}>
                {principles.value.map((item, index) => (
                  <li key={item} className="glass flex gap-3 rounded-xl border p-4">
                    <span aria-hidden className="font-mono text-xs text-lane-career tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <Credentials />

          <Volunteering />
        </div>

        <aside className="space-y-10">
          {profile.photo !== undefined && <Avatar name={profile.name} caption="victor@hub:~$ whoami" />}
          <section aria-labelledby="now" className="glass space-y-5 rounded-2xl border p-5">
            <h2 id="now" className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              <CompassIcon className="size-3.5" aria-hidden />
              {t("now")}
            </h2>
            {current.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BriefcaseIcon className="size-3.5" aria-hidden />
                  {t("working")}
                </h3>
                <ul className="space-y-1">
                  {current.map(({ experience, title, organization }) => (
                    <li key={experience.id}>
                      <Link href={`/career/${experience.id}`} className="font-medium hover:text-lane-career" lang={title.locale}>
                        {title.value}
                      </Link>
                      {organization !== undefined && <span className="text-muted-foreground"> · {organization}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {focus !== undefined && (
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <SparklesIcon className="size-3.5" aria-hidden />
                  {t("focus")}
                </h3>
                <ul className="list-disc space-y-1 pl-5 marker:text-lane-project" lang={focus.locale}>
                  {focus.value.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {studying !== undefined && (
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BookOpenIcon className="size-3.5" aria-hidden />
                  {t("studying")}
                </h3>
                <ul className="list-disc space-y-1 pl-5 marker:text-lane-study" lang={studying.locale}>
                  {studying.value.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {latestPost !== undefined && (
              <div className="space-y-1.5">
                <h3 className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <PenLineIcon className="size-3.5" aria-hidden />
                  {t("latestPost")}
                </h3>
                <Link href={`/weblog/${latestPost.slug}`} className="font-medium hover:text-lane-writing" lang={latestPost.locale}>
                  {latestPost.frontmatter.title}
                </Link>
              </div>
            )}
            <ul className="flex flex-wrap gap-x-5 border-t pt-2 text-sm">
              <li>
                <Link
                  href="/now"
                  className="group/link inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {t("nowLog")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
                </Link>
              </li>
              <li>
                <Link
                  href="/next"
                  className="group/link inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {t("next")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
                </Link>
              </li>
              <li>
                <Link href="/wow" className="inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-foreground">
                  {t("wow")} <ArrowRightIcon className="size-3.5" aria-hidden />
                </Link>
              </li>
              <li>
                <Link
                  href="/weblog/how-this-site-is-built"
                  className="group/link inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {t("howBuilt")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
                </Link>
              </li>
            </ul>
          </section>
          <AboutNumbers />
          {profile.languages.length > 0 && (
            <section aria-labelledby="languages">
              <h2 id="languages" className="mb-3 flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                <LanguagesIcon className="size-3.5" aria-hidden />
                {t("languages")}
              </h2>
              <dl className="space-y-1.5">
                {profile.languages.map((language) => {
                  const name = localize(language.name, locale);
                  const level = localize(language.level, locale);
                  return (
                    <div key={name.value} className="flex flex-wrap items-baseline gap-x-2">
                      <dt className="font-medium" lang={name.locale}>
                        {name.value}
                      </dt>
                      <dd className="text-sm text-muted-foreground" lang={level.locale}>
                        {level.value}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}
          <section aria-labelledby="elsewhere">
            <h2 id="elsewhere" className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              {t("elsewhere")}
            </h2>
            <ul className="space-y-1.5">
              {profile.links.map((link) => (
                <li key={link.url}>
                  <ExternalLink
                    href={link.url}
                    me={link.kind === "profile"}
                    className="group/link inline-flex items-center gap-2 hover:text-lane-career"
                  >
                    <ContentLinkIcon link={link} />
                    {link.label}
                    <ExternalLinkIcon className="icon-out size-3.5 text-muted-foreground" aria-hidden />
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {recommendations.length > 0 && (
        <section aria-labelledby="recommendations" className="mt-16 scroll-mt-24">
          <SectionHeading id="recommendations" icon={MessageSquareQuoteIcon} info={recs("info")}>
            {recs("title")}
          </SectionHeading>
          {/* Columns, not a grid: texts of very different lengths stack without gaps. */}
          <ul className="gap-4 md:columns-2">
            {recommendations.map((item) => (
              <li key={item.id} className="mb-4 break-inside-avoid">
                <RecommendationCard item={item} full />
              </li>
            ))}
          </ul>
        </section>
      )}

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
                  <blockquote lang={quote.locale} className="text-lg">
                    {quote.text}
                  </blockquote>
                  <figcaption className="mt-1 text-sm text-muted-foreground">
                    {quote.url !== undefined ? (
                      <ExternalLink href={quote.url} className="hover:text-foreground">
                        — {quote.source}
                      </ExternalLink>
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

      <Curiosities items={profile.curiosities} />

      <div className="mt-12">
        <SourceLink file="profile/profile.yaml" />
      </div>
    </PageTransition>
  );
}
