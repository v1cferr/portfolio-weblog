import { type ContentRegistry, type Locale, localize, localizeList } from "@workspace/content";

import type { SearchDocument } from "./options";

/** Rough MDX → text: drops code fences, imports, JSX tags and Markdown punctuation. */
export function mdxToText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^(import|export)\s.*$/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function join(...parts: (string | readonly string[] | undefined)[]): string {
  return parts
    .flat()
    .filter((part): part is string => part !== undefined && part !== "")
    .join(" \n");
}

/**
 * Normalized documents for everything a visitor of `locale` can see. Takes
 * the public registry, so drafts and private entities cannot get in.
 */
export function buildSearchDocuments(content: ContentRegistry, locale: Locale): SearchDocument[] {
  const docs: SearchDocument[] = [];
  const techNames = (ids: readonly string[]) => ids.map((id) => content.getTechnology(id)?.name).filter((name) => name !== undefined);
  const prefix = `/${locale}`;

  for (const experience of content.getExperiences()) {
    const org = content.getOrganization(experience.organization)?.name ?? experience.organization;
    const summary = localize(experience.summary, locale);
    const titles = experience.positions.map((position) => localize(position.title, locale).value);
    docs.push({
      id: `experience:${experience.id}:${locale}`,
      entityId: experience.id,
      type: "experience",
      locale: summary.locale,
      section: "career",
      title: `${titles.at(-1) ?? ""} · ${org}`,
      keywords: join(org, techNames(experience.technologies), titles),
      text: join(
        summary.value,
        experience.context && localize(experience.context, locale).value,
        localizeList(experience.responsibilities, locale)?.value,
        localizeList(experience.contributions, locale)?.value,
        localizeList(experience.learnings, locale)?.value
      ),
      excerpt: summary.value,
      url: `${prefix}/career/${experience.id}`,
    });
  }

  for (const project of content.getProjects()) {
    const summary = localize(project.summary, locale);
    docs.push({
      id: `project:${project.id}:${locale}`,
      entityId: project.id,
      type: "project",
      locale: summary.locale,
      section: "projects",
      title: project.title,
      keywords: join(techNames(project.technologies), project.repository),
      text: join(
        summary.value,
        project.description && localize(project.description, locale).value,
        project.problem && localize(project.problem, locale).value,
        localizeList(project.learnings, locale)?.value
      ),
      excerpt: summary.value,
      url: `${prefix}/projects/${project.id}`,
    });
  }

  for (const item of content.getEducation()) {
    const title = localize(item.title, locale);
    docs.push({
      id: `education:${item.id}:${locale}`,
      entityId: item.id,
      type: "education",
      locale: title.locale,
      section: "education",
      title: title.value,
      keywords: join(content.getOrganization(item.institution)?.name, techNames(item.technologies)),
      text: join(item.summary && localize(item.summary, locale).value, localizeList(item.learnings, locale)?.value),
      excerpt: content.getOrganization(item.institution)?.name ?? "",
      url: `${prefix}/education#${item.id}`,
    });
  }

  for (const cert of content.getCertifications()) {
    docs.push({
      id: `certification:${cert.id}:${locale}`,
      entityId: cert.id,
      type: "certification",
      locale,
      section: "education",
      title: cert.name,
      keywords: join(content.getOrganization(cert.issuer)?.name, techNames(cert.technologies)),
      text: cert.name,
      excerpt: content.getOrganization(cert.issuer)?.name ?? "",
      url: `${prefix}/education#${cert.id}`,
    });
  }

  for (const post of content.getPosts(locale)) {
    docs.push({
      id: `post:${post.slug}:${locale}`,
      entityId: post.slug,
      type: "post",
      locale: post.locale,
      section: "weblog",
      title: post.frontmatter.title,
      keywords: join(post.frontmatter.tags, techNames(post.frontmatter.technologies)),
      text: join(post.frontmatter.summary, mdxToText(post.body)),
      excerpt: post.frontmatter.summary,
      url: `${prefix}/weblog/${post.slug}`,
    });
  }

  for (const tech of content.getTechnologies()) {
    docs.push({
      id: `technology:${tech.id}:${locale}`,
      entityId: tech.id,
      type: "technology",
      locale,
      section: "projects",
      title: tech.name,
      keywords: tech.category,
      text: tech.name,
      excerpt: tech.category,
      url: `${prefix}/projects?tech=${tech.id}`,
    });
  }

  return docs;
}
