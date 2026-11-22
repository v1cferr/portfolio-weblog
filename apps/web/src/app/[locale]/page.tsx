import { localize, localizeList } from "@workspace/content";
import { ArrowRightIcon, FolderGit2Icon, HistoryIcon, MapPinIcon, PenLineIcon, RouteIcon, TargetIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { GitSpine, SpineBranch, SpineHead } from "@/components/git-spine";
import { NixosLogo } from "@/components/nixos-logo";
import { V1cLogo } from "@/components/v1c-logo";
import { Avatar } from "@/features/profile/avatar";
import { SectionHeading, StorePath } from "@/components/page-header";
import { SocialLinks } from "@/components/social-links";
import { Trajectory } from "@/features/profile/trajectory";
import { CommitGraph } from "@/features/timeline/commit-graph";
import { PostCard } from "@/features/weblog/post-card";
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
  const posts = content.getPosts(locale).slice(0, 3);
  const index = await getRepoIndex();
  const recent = content
    .getUnifiedTimeline({ repositoryCreatedAt: (repository) => (index.ok ? index.get(repository)?.created_at : undefined) })
    .slice(0, 6);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(locale)) }} />
      <GitSpine>
        <section className="grid items-end gap-8 pb-14 md:grid-cols-[1fr_auto] md:pb-20">
          <div className="relative space-y-5">
            {/* Two signatures behind the hero: the owner's mark by the name, NixOS on the right. */}
            <V1cLogo
              data-spotlight-local=""
              className="spotlight-reveal pointer-events-none absolute top-8 left-0 -z-10 size-[20rem] text-lane-project max-md:top-12 max-md:size-44"
            />
            <NixosLogo
              data-spotlight-local=""
              className="spotlight-reveal pointer-events-none absolute -top-10 right-0 -z-10 size-[26rem] max-md:size-64"
            />
            <SpineHead />
            <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <StorePath path="profile/profile.yaml" name={profile.handle} />
              <span aria-hidden>·</span>
              <MapPinIcon className="size-3.5" aria-hidden />
              {profile.location}
            </p>
            <h1 className="font-display text-5xl leading-[0.95] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {/* Every stop is a text colour that already passes 4.5:1 on the page. */}
              <span className="bg-linear-to-r from-foreground from-30% via-lane-project via-75% to-lane-writing bg-clip-text text-transparent">
                {profile.name}
              </span>
              <span
                className="mt-4 block font-sans text-2xl font-medium tracking-normal text-muted-foreground [font-variation-settings:normal] sm:text-3xl"
                lang={headline.locale}
              >
                {headline.value}
              </span>
            </h1>
            <p className="max-w-2xl text-lg text-pretty" lang={summary.locale}>
              {summary.value}
            </p>
            <SocialLinks links={profile.links} label={common("links")} />
          </div>
          {profile.photo !== undefined && (
            <Avatar name={profile.name} caption="victor@hub:~$ whoami" priority className="hidden md:block lg:w-[30rem]" />
          )}
        </section>

        {profile.trajectory.length > 0 && (
          <section aria-labelledby="trajectory" className="mb-16">
            <SectionHeading id="trajectory" icon={RouteIcon} branch={<SpineBranch lane="career" />}>
              {t("trajectory")}
            </SectionHeading>
            <Trajectory steps={profile.trajectory} label={t("trajectory")} />
          </section>
        )}

        {focus !== undefined && (
          <section aria-labelledby="focus" className="mb-16 max-w-3xl">
            <SectionHeading id="focus" icon={TargetIcon} branch={<SpineBranch lane="study" />}>
              {t("focus")}
            </SectionHeading>
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
              icon={FolderGit2Icon}
              branch={<SpineBranch lane="project" />}
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

        <section aria-labelledby="latest" className="mb-16 max-w-4xl">
          <SectionHeading
            id="latest"
            icon={PenLineIcon}
            branch={<SpineBranch lane="writing" />}
            action={
              <Link href="/weblog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                {common("seeAll")} <ArrowRightIcon className="size-3.5" aria-hidden />
              </Link>
            }
          >
            {t("latest")}
          </SectionHeading>
          {posts.length === 0 ? (
            <p className="text-muted-foreground">{t("noPosts")}</p>
          ) : (
            <div className="border-t">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>

        {recent.length > 0 && (
          <section aria-labelledby="recent" className="mb-16">
            <SectionHeading
              id="recent"
              icon={HistoryIcon}
              branch={<SpineBranch merge />}
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
      </GitSpine>
    </>
  );
}
