import { localize, localizeList } from "@workspace/content";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { SectionHeading } from "@/components/page-header";
import { Trajectory } from "@/features/profile/trajectory";
import { CommitGraph } from "@/features/timeline/commit-graph";
import { ProjectCard } from "@/features/projects/project-card";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { getRepoIndex } from "@/lib/github";
import { personJsonLd } from "@/lib/structured-data";

// The "Recently" list can use repository creation dates from GitHub.
export const revalidate = 86400;

export default async function HomePage() {
  const locale = await getLocale();
  const [t, common] = await Promise.all([getTranslations("Home"), getTranslations("Common")]);
  const content = getContent();
  const profile = content.getProfile();
  const headline = localize(profile.headline, locale);
  const summary = localize(profile.summary, locale);
  const focus = localizeList(profile.focus, locale);
  const featured = content.getProjects().filter((project) => project.featured);
  const index = await getRepoIndex();
  const recent = content
    .getUnifiedTimeline({ repositoryCreatedAt: (repository) => (index.ok ? index.get(repository)?.created_at : undefined) })
    .slice(0, 6);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(locale)) }} />

      <section className="grid items-end gap-8 pb-14 md:grid-cols-[1fr_auto] md:pb-20">
        <div className="space-y-5">
          <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <MapPinIcon className="size-3.5" aria-hidden />
            {profile.location}
          </p>
          <h1 className="font-display text-5xl leading-[0.95] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {profile.name}
            <span className="mt-3 block text-2xl font-medium tracking-normal text-muted-foreground sm:text-3xl" lang={headline.locale}>
              {headline.value}
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-pretty" lang={summary.locale}>
            {summary.value}
          </p>
          <ul className="flex flex-wrap gap-2">
            {profile.links.slice(0, 4).map((link) => (
              <li key={link.url}>
                <Button asChild variant="outline" size="sm">
                  <a href={link.url} rel={link.kind === "profile" ? "me" : undefined}>
                    {link.label}
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
        {profile.photo !== undefined && (
          <Image
            src={profile.photo}
            alt={profile.name}
            width={220}
            height={220}
            priority
            className="hidden aspect-square rounded-xl border object-cover grayscale-[35%] md:block"
          />
        )}
      </section>

      {profile.trajectory.length > 0 && (
        <section aria-labelledby="trajectory" className="mb-16">
          <SectionHeading id="trajectory">{t("trajectory")}</SectionHeading>
          <Trajectory steps={profile.trajectory} label={t("trajectory")} />
        </section>
      )}

      {focus !== undefined && (
        <section aria-labelledby="focus" className="mb-16 max-w-3xl">
          <SectionHeading id="focus">{t("focus")}</SectionHeading>
          <ul className="divide-y border-y" lang={focus.locale}>
            {focus.value.map((item) => (
              <li key={item} className="py-3 text-lg">
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {featured.length > 0 && (
        <section aria-labelledby="featured" className="mb-16">
          <SectionHeading
            id="featured"
            action={
              <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                {common("seeAll")} <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
            }
          >
            {t("featured")}
          </SectionHeading>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="recent" className="mb-16">
          <SectionHeading
            id="recent"
            action={
              <Link href="/timeline" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                {common("seeAll")} <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
            }
          >
            {t("recent")}
          </SectionHeading>
          <CommitGraph events={recent} groupByYear={false} label={t("recent")} />
        </section>
      )}
    </>
  );
}
