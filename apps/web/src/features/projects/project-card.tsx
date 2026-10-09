import { localize, type Project } from "@workspace/content";
import { getLocale, getTranslations } from "next-intl/server";

import { getContent } from "@/lib/content";

import { type ProjectCardData, ProjectCardView } from "./project-card-view";

export async function toCardData(project: Project): Promise<ProjectCardData> {
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
    technologies: project.technologies.flatMap((id) => {
      const tech = content.getTechnology(id);
      return tech === undefined ? [] : [{ id, name: tech.name }];
    }),
  };
}

export async function ProjectCard({ project }: { project: Project }) {
  return <ProjectCardView project={await toCardData(project)} />;
}
