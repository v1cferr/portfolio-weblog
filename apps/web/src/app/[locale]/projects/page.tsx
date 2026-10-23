import { FolderGit2Icon } from "lucide-react";
import { ProjectCategory, ProjectState } from "@workspace/content";
import type { GitHubRepo } from "@workspace/github";
import { Skeleton } from "@workspace/ui/components/skeleton";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHeader, SectionHeading } from "@/components/page-header";
import { PartialDate } from "@/components/date-range";
import { toCardData } from "@/features/projects/project-card";
import { ProjectCatalog } from "@/features/projects/project-catalog";
import { getContent } from "@/lib/content";
import { getRepoIndex } from "@/lib/github";
import { pageAlternates } from "@/lib/i18n";

function used<T extends string>(values: readonly T[], present: Set<string>): T[] {
  return values.filter((value) => present.has(value));
}

const UNCURATED_VISIBLE = 8;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Projects");
  return { title: t("title"), description: t("description"), alternates: pageAlternates(locale, "/projects") };
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-48 rounded-xl" />
      ))}
    </div>
  );
}

function UncuratedRow({ repo }: { repo: GitHubRepo }) {
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-4">
      <a href={repo.html_url} className="font-mono text-sm font-medium hover:text-lane-project sm:w-64 sm:shrink-0">
        {repo.name}
      </a>
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

  const states = used(ProjectState.options, new Set(projects.map((p) => p.state))).map((value) => ({ value, label: t(`state.${value}`) }));
  const categories = used(ProjectCategory.options, new Set(projects.map((p) => p.category))).map((value) => ({
    value,
    label: t(`category.${value}`),
  }));
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
    <>
      <PageHeader eyebrow="content/projects" icon={FolderGit2Icon} title={t("title")} description={t("description")} />
      {/* useSearchParams needs a boundary to keep the page static. */}
      <Suspense fallback={<CatalogSkeleton />}>
        <ProjectCatalog projects={cards} states={states} categories={categories} technologies={technologies} />
      </Suspense>

      {uncurated.length > 0 && (
        <section aria-labelledby="uncurated" className="mt-20">
          <SectionHeading id="uncurated">{t("uncurated")}</SectionHeading>
          <p className="mb-6 max-w-2xl text-sm text-muted-foreground">{t("uncuratedDescription")}</p>
          {/* The first few stay in view; the rest fold away, newest first either way. */}
          <ul className="divide-y border-y">
            {uncurated.slice(0, UNCURATED_VISIBLE).map((repo) => (
              <UncuratedRow key={repo.full_name} repo={repo} />
            ))}
          </ul>
          {uncurated.length > UNCURATED_VISIBLE && (
            <details className="group">
              <summary className="mt-3 cursor-pointer list-none font-mono text-sm text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">{t("showAll", { count: uncurated.length })}</span>
                <span className="hidden group-open:inline">{t("showLess")}</span>
              </summary>
              <ul className="mt-3 divide-y border-y">
                {uncurated.slice(UNCURATED_VISIBLE).map((repo) => (
                  <UncuratedRow key={repo.full_name} repo={repo} />
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
    </>
  );
}
