import { localize } from "@workspace/content";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  FolderGit2Icon,
  HistoryIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareQuoteIcon,
  PenLineIcon,
  SparklesIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { NAV_SECTION, PageTransition } from "@/components/page-transition";
import { GitSpine, SpineBranch, SpineHead } from "@/components/git-spine";
import { NixosLogo } from "@/components/nixos-logo";
import { V1cLogo } from "@/components/v1c-logo";
import { AskButton, AskInput, TrackedAnchor } from "@/features/home/cta";
import { ProofLine } from "@/features/home/proof-line";
import { StartHere } from "@/features/home/start-here";
import { NowCard } from "@/features/now/now-card";
import { Avatar } from "@/features/profile/avatar";
import { featuredRecommendations, RecommendationCard } from "@/features/profile/recommendations";
import { StackChips } from "@/features/profile/stack-chips";
import { SectionHeading, StorePath } from "@/components/page-header";
import { SocialLinks } from "@/components/social-links";
import { CommitGraph } from "@/features/timeline/commit-graph";
import { PostCard } from "@/features/weblog/post-card";
import { ProjectCard } from "@/features/projects/project-card";
import { LearningStrip } from "@/features/studies/learning-strip";
import { Link } from "@/i18n/navigation";
import { getContent } from "@/lib/content";
import { getRepoIndex } from "@/lib/github";
import { ownerTitle } from "@/lib/current-role";
import { homeJsonLd } from "@/lib/structured-data";

// The "Recently" list can use repository creation dates from GitHub.
export const revalidate = 86400;

/**
 * The home page's title carries the handle and the aliases next to the name,
 * so a search for "v1cferr" or "V1C" matches the page itself, not only its
 * structured data. Other pages keep the short "Page · Name" template.
 */
export function generateMetadata(): Metadata {
  const profile = getContent().getProfile();
  return { title: { absolute: `${profile.name} (${[profile.handle, ...profile.aliases].join(", ")})` } };
}

export default async function HomePage() {
  const locale = await getLocale();
  const [t, common, recs] = await Promise.all([getTranslations("Home"), getTranslations("Common"), getTranslations("Recommendations")]);
  const content = getContent();
  const profile = content.getProfile();
  const headline = ownerTitle(locale);
  const summary = localize(profile.summary, locale);
  const email = profile.links.find((link) => link.kind === "email")?.url;
  const availability = profile.availability?.open === true ? profile.availability : undefined;
  const availabilityNote = availability?.note === undefined ? undefined : localize(availability.note, locale);
  const featured = content.getProjects().filter((project) => project.featured);
  const recommendations = featuredRecommendations();
  const recommendationCount = content.getRecommendations().length;
  const posts = content.getPosts(locale).slice(0, 3);
  const index = await getRepoIndex();
  const recent = content
    .getUnifiedTimeline({ repositoryCreatedAt: (repository) => (index.ok ? index.get(repository)?.created_at : undefined) })
    .slice(0, 6);

  return (
    <PageTransition>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd(locale)) }} />
      <GitSpine>
        <section className="grid items-end gap-8 pb-14 md:grid-cols-[1fr_auto] md:pb-20">
          <div className="relative space-y-5">
            {/*
             * Two signatures behind the hero text, on opposite corners so they never stack: the owner's
             * mark behind the name (top left), NixOS behind the summary (bottom right). The column is only
             * as wide as the space the avatar leaves, so the sizes step with it.
             */}
            <V1cLogo
              data-spotlight-local=""
              className="spotlight-reveal pointer-events-none absolute top-12 left-0 -z-10 size-44 text-primary md:top-8 lg:size-56 xl:size-68"
            />
            <NixosLogo
              data-spotlight-local=""
              className="spotlight-reveal pointer-events-none absolute right-0 bottom-0 -z-10 size-40 lg:size-44 xl:size-60"
            />
            <SpineHead />
            <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <StorePath path="profile/profile.yaml" name={profile.handle} />
              <span aria-hidden>·</span>
              <MapPinIcon className="size-3.5" aria-hidden />
              {profile.location}
            </p>
            <h1 className="font-display text-5xl leading-[0.95] font-semibold tracking-tighter text-balance sm:text-6xl lg:text-7xl">
              {/* Solid foreground: colour is kept for meaning, not for the name. */}
              <span>{profile.name}</span>
              <span
                className="mt-4 block font-sans text-2xl font-medium tracking-normal text-muted-foreground [font-variation-settings:normal] sm:text-3xl"
                lang={headline.locale}
              >
                {headline.value}
              </span>
            </h1>
            {/* Role, areas and daily stack only; where the owner works shows in the proof line and the career. */}
            {profile.specialties.length > 0 && (
              <p className="max-w-2xl font-mono text-sm text-balance text-muted-foreground" lang="en-us">
                {profile.specialties.join(" · ")}
              </p>
            )}
            <StackChips stack={profile.stack} label={t("stack")} />
            <p className="max-w-2xl text-lg text-pretty" lang={summary.locale}>
              {summary.value}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <AskButton from="hero" size="lg" className="h-11 rounded-full px-5 text-base">
                <SparklesIcon aria-hidden className="size-4" />
                {t("askAi")}
              </AskButton>
              {email !== undefined && (
                <Button asChild variant="outline" size="lg" className="h-11 rounded-full px-5 text-base">
                  <TrackedAnchor href={email} event="cta_contact">
                    <MailIcon aria-hidden className="size-4" />
                    {t("contact")}
                  </TrackedAnchor>
                </Button>
              )}
              {profile.cv !== undefined && (
                <TrackedAnchor
                  href={profile.cv}
                  event="cta_cv"
                  target="_blank"
                  rel="noopener"
                  className="group/link inline-flex min-h-11 items-center gap-0.5 px-1 font-medium underline-offset-4 hover:underline"
                >
                  {t("cv")} <ArrowUpRightIcon aria-hidden className="icon-out size-4" />
                </TrackedAnchor>
              )}
              {availability !== undefined && (
                <Badge variant="now" data-availability="" className="h-7 px-3 text-sm" lang={availabilityNote?.locale}>
                  {availabilityNote?.value ?? t("available")}
                </Badge>
              )}
            </div>
            <AskInput label={t("askLabel")} placeholder={t("askPlaceholder")} submit={t("askSubmit")} />
            <SocialLinks links={profile.links} label={common("links")} size="sm" tinted className="pt-1" />
          </div>
          {profile.photo !== undefined && (
            // Shown at every width: phones get the same photo (and its alt text) as desktop, which is
            // what mobile-first indexing reads, and a priority image is never preloaded only to stay hidden.
            <Avatar name={profile.name} caption="victor@hub:~$ whoami" priority className="max-md:w-72 lg:w-[24rem]" />
          )}
        </section>

        <StartHere email={email} cv={profile.cv} />
        <ProofLine />

        {/* Social proof early: what the people I worked and studied with wrote, before the projects. */}
        {recommendations.length > 0 && (
          <section aria-labelledby="recommendations" className="mb-16">
            <SectionHeading
              id="recommendations"
              icon={MessageSquareQuoteIcon}
              branch={<SpineBranch lane="career" />}
              action={
                <Link
                  href="/about#recommendations"
                  className="group/link inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {recs("seeAll", { count: recommendationCount })} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
                </Link>
              }
            >
              {recs("title")}
            </SectionHeading>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((item) => (
                <li key={item.id}>
                  <RecommendationCard item={item} />
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
                <Link
                  href="/projects"
                  transitionTypes={NAV_SECTION}
                  className="group/link inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {common("seeAll")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
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

        {/* Side by side on wide screens: the Now card on the spine, the studies beside it. */}
        <div className="grid items-start gap-x-10 lg:grid-cols-2">
          <NowCard />
          <div>
            <LearningStrip onSpine={false} />
          </div>
        </div>

        {posts.length > 0 && (
          <section aria-labelledby="latest" className="mb-16 max-w-4xl">
            <SectionHeading
              id="latest"
              icon={PenLineIcon}
              branch={<SpineBranch lane="writing" />}
              action={
                <Link
                  href="/weblog"
                  transitionTypes={NAV_SECTION}
                  className="group/link inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {common("seeAll")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
                </Link>
              }
            >
              {t("latest")}
            </SectionHeading>
            <div className="border-t">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section aria-labelledby="recent" className="mb-16">
            <SectionHeading
              id="recent"
              icon={HistoryIcon}
              branch={<SpineBranch merge />}
              action={
                <Link
                  href="/timeline"
                  transitionTypes={NAV_SECTION}
                  className="group/link inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {common("seeAll")} <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
                </Link>
              }
            >
              {t("recent")}
            </SectionHeading>
            <CommitGraph events={recent} groupByYear={false} label={t("recent")} />
          </section>
        )}
      </GitSpine>
    </PageTransition>
  );
}
