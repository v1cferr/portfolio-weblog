import { FolderGit2Icon } from "lucide-react";
import type { GitHubRepo } from "@workspace/github";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { PageTransition } from "@/components/page-transition";
import { PageHeader, SectionHeading } from "@/components/page-header";
import { PartialDate } from "@/components/date-range";
import { toCardData } from "@/features/projects/project-card";
import { ProjectCatalog } from "@/features/projects/project-catalog";
import { ShowMore } from "@/features/projects/show-more";
import { getContent } from "@/lib/content";
import { getRepoIndex } from "@/lib/github";
import { pageAlternates } from "@/lib/i18n";
import { pageOpenGraph } from "@/lib/metadata";
import { ExternalLink } from "@/components/external-link";

const UNCURATED_VISIBLE = 8;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Projects");
  return {
    title: t("title"),
    description: `${t("description")} ${t("descriptionInfo")}`,
    alternates: pageAlternates(locale, "/projects"),
    openGraph: { type: "website", ...pageOpenGraph(locale, "/projects") },
  };
}

function UncuratedRow({ repo }: { repo: GitHubRepo }) {
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
      <ExternalLink href={repo.html_url} className="font-mono text-sm font-medium hover:text-lane-project sm:w-64 sm:shrink-0">
        {repo.name}
      </ExternalLink>
      <span className="flex-1 text-sm text-muted-foreground">{repo.description}</span>
      <span className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
        {repo.language}
        {repo.pushed_at !== null && <PartialDate date={repo.pushed_at.slice(0, 10)} />}
      </span>
    </li>
  );
}

export default async function ProjectsPage() {
  const t = await getTranslations("Projects");
  const content = getContent();
  const projects = content.getProjects();

  const technologies = content
    .getTechnologies()
    .filter((tech) => projects.some((p) => p.technologies.includes(tech.id)))
    .map((tech) => ({ value: tech.id, label: tech.name }));

  // Public repositories the content does not curate. Shown apart, never mixed in.
  const curated = new Set(projects.flatMap((p) => (p.repository === undefined ? [] : [p.repository.toLowerCase()])));
  const index = await getRepoIndex();
  const cards = await Promise.all(
    projects.map((project) => toCardData(project, (repository) => (index.ok ? index.get(repository)?.created_at : undefined)))
  );
  const uncurated = index.ok ? index.repos.filter((repo) => !repo.fork && !curated.has(repo.full_name.toLowerCase())) : [];

  return (
    <PageTransition>
      <PageHeader
        source={{ path: "projects" }}
        icon={FolderGit2Icon}
        title={t("title")}
        description={t("description")}
        info={t("descriptionInfo")}
      />
      <ProjectCatalog projects={cards} technologies={technologies} />

      {uncurated.length > 0 && (
        <section aria-labelledby="uncurated" className="mt-20">
          <SectionHeading id="uncurated" info={t("uncuratedDescription")}>
            {t("uncurated")}
          </SectionHeading>
          {/* The first few stay in view; the rest fold away, newest first either way. */}
          <ul className="divide-y border-y">
            {uncurated.slice(0, UNCURATED_VISIBLE).map((repo) => (
              <UncuratedRow key={repo.full_name} repo={repo} />
            ))}
          </ul>
          {uncurated.length > UNCURATED_VISIBLE && (
            <ShowMore stateId="uncurated" more={t("showAll", { count: uncurated.length })} less={t("showLess")}>
              <ul className="divide-y border-b">
                {uncurated.slice(UNCURATED_VISIBLE).map((repo) => (
                  <UncuratedRow key={repo.full_name} repo={repo} />
                ))}
              </ul>
            </ShowMore>
          )}
        </section>
      )}
    </PageTransition>
  );
}
