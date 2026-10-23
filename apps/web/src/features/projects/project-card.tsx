import { localize, type Project } from "@workspace/content";
import { getLocale, getTranslations } from "next-intl/server";

import { getContent } from "@/lib/content";

import { type ProjectCardData, ProjectCardView } from "./project-card-view";

/** `repositoryCreatedAt` resolves the fallback date for projects without `startedAt`. */
export async function toCardData(
  project: Project,
  repositoryCreatedAt?: (repository: string) => string | undefined
): Promise<ProjectCardData> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Projects")]);
  const content = getContent();
  const summary = localize(project.summary, locale);
  return {
    id: project.id,
    title: project.title,
    summary: summary.value,
    summaryLocale: summary.locale,
    state: project.state,
    stateLabel: t(`state.${project.state}`),
    category: project.category,
    categoryLabel: t(`category.${project.category}`),
    featured: project.featured,
    ...dateOf(project, repositoryCreatedAt),
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

export async function ProjectCard({ project }: { project: Project }) {
  return <ProjectCardView project={await toCardData(project)} />;
}
