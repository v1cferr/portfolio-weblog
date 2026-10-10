import "server-only";

import { type EntityType, localize } from "@workspace/content";

import type { Locale } from "@/i18n/routing";

import { getContent } from "./content";

export interface EntitySummary {
  id: string;
  type: EntityType;
  title: string;
  /** Second line, e.g. the organization of a position. */
  subtitle?: string;
  /** Locale-less path, for the i18n Link. Undefined when the entity has no page. */
  href?: string;
}

/** Title and URL of any public entity, resolved the same way everywhere. */
export function describeEntity(id: string, locale: Locale): EntitySummary | undefined {
  const content = getContent();
  const type = content.getEntityType(id);
  switch (type) {
    case "experience": {
      const experience = content.getExperience(id);
      if (experience === undefined) return undefined;
      const latest = experience.positions.at(-1);
      return {
        id,
        type,
        title: content.getOrganization(experience.organization)?.name ?? id,
        ...(latest !== undefined && { subtitle: localize(latest.title, locale).value }),
        href: `/career/${id}`,
      };
    }
    case "project": {
      const project = content.getProject(id);
      return project && { id, type, title: project.title, subtitle: localize(project.summary, locale).value, href: `/projects/${id}` };
    }
    case "education": {
      const item = content.getEducation().find((entry) => entry.id === id);
      return item && { id, type, title: localize(item.title, locale).value, href: `/education#${id}` };
    }
    case "certification": {
      const cert = content.getCertifications().find((entry) => entry.id === id);
      return cert && { id, type, title: cert.name, href: `/education#${id}` };
    }
    case "post": {
      const post = content.getPost(id, locale);
      return post && { id, type, title: post.frontmatter.title, subtitle: post.frontmatter.summary, href: `/weblog/${id}` };
    }
    case "technology": {
      const tech = content.getTechnology(id);
      return tech && { id, type, title: tech.name, href: `/projects?tech=${id}` };
    }
    case "skill": {
      const skill = content.getSkill(id);
      return skill && { id, type, title: localize(skill.name, locale).value };
    }
    case "organization": {
      const org = content.getOrganization(id);
      return org && { id, type, title: org.name };
    }
    case undefined:
      return undefined;
  }
}
