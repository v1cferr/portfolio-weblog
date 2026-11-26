import { localize, type Project } from "@workspace/content";
import { getLocale, getTranslations } from "next-intl/server";

import { getContent } from "@/lib/content";
import { getRepoLanguages } from "@/lib/github";
import { storePath } from "@/lib/store-path";

import { describeLanguages } from "./languages";
import { type ProjectCardData, ProjectCardView } from "./project-card-view";

/** /nix/store/abcdefg…-name, shortened the way the page eyebrows and share cards show it. */
function shortStorePath(id: string): string {
  const { hash } = storePath(`projects/${id}.yaml`);
  return `/nix/store/${hash.slice(0, 7)}…-${id}`;
}

/** `repositoryCreatedAt` resolves the fallback date for projects without `startedAt`. */
export async function toCardData(
  project: Project,
  repositoryCreatedAt?: (repository: string) => string | undefined
): Promise<ProjectCardData> {
  const [locale, t, repoLanguages] = await Promise.all([
    getLocale(),
    getTranslations("Projects"),
    project.repository !== undefined ? getRepoLanguages(project.repository) : undefined,
  ]);
  const languages = repoLanguages?.languages.map(({ name, percent, color, other }) => ({
    name: other === true ? t("otherLanguages") : name,
    percent,
    color,
  }));
  const content = getContent();
  const summary = localize(project.summary, locale);
  const hook = project.hook && localize(project.hook, locale);
  const proof = project.proof && localize(project.proof, locale);
  const [first] = project.media;
  return {
    id: project.id,
    title: project.title,
    summary: summary.value,
    summaryLocale: summary.locale,
    hook: hook?.value,
    hookLocale: hook?.locale,
    proof: proof?.value,
    proofLocale: proof?.locale,
    cover: first && { src: first.src, width: first.width, height: first.height },
    storePath: shortStorePath(project.id),
    state: project.state,
    stateLabel: t(`state.${project.state}`),
    category: project.category,
    categoryLabel: t(`category.${project.category}`),
    featured: project.featured,
    caseStudyLabel: project.caseStudy !== undefined ? t("caseStudy") : undefined,
    ...dateOf(project, repositoryCreatedAt),
    languages,
    // The top three are enough to name the bar; the project page has the full legend.
    languagesLabel: languages && t("languagesBar", { list: describeLanguages(languages, locale, 3) }),
    technologies: project.technologies.flatMap((id) => {
      const tech = content.getTechnology(id);
      return tech === undefined ? [] : [{ id, name: tech.name, icon: tech.icon, category: tech.category }];
    }),
  };
}

function dateOf(project: Project, repositoryCreatedAt?: (repository: string) => string | undefined) {
  if (project.startedAt !== undefined) return { date: project.startedAt, dateFromRepository: false };
  const created = project.repository !== undefined ? repositoryCreatedAt?.(project.repository) : undefined;
  return created !== undefined ? { date: created.slice(0, 10), dateFromRepository: true } : { dateFromRepository: false };
}

export async function ProjectCard({ project, eager = false }: { project: Project; eager?: boolean }) {
  return <ProjectCardView project={await toCardData(project)} eager={eager} />;
}
