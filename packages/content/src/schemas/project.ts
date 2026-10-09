import { z } from "zod";

import { entityBase, Id, Link, LocalizedList, LocalizedText, PartialDate } from "./common";

/**
 * Editorial lifecycle of a project, set by hand. A quiet repository does not
 * make a project abandoned, so this is never inferred from commit activity.
 */
export const ProjectState = z.enum(["active", "maintained", "stable", "experimental", "paused", "historical", "archived"]);
export type ProjectState = z.infer<typeof ProjectState>;

export const ProjectCategory = z.enum(["personal", "professional", "academic", "study", "challenge"]);
export type ProjectCategory = z.infer<typeof ProjectCategory>;

export const Project = z.strictObject({
  ...entityBase,
  title: z.string().min(1),
  summary: LocalizedText,
  description: LocalizedText.optional(),
  /** What the project solves; PWL-96 asks every project to make this explicit. */
  problem: LocalizedText.optional(),
  learnings: LocalizedList.default({}),
  state: ProjectState,
  category: ProjectCategory,
  featured: z.boolean().default(false),
  /**
   * When the work actually started. Optional: without it the timeline falls
   * back to the repository creation date and labels it as such.
   */
  startedAt: PartialDate.optional(),
  endedAt: PartialDate.optional(),
  /** Public GitHub repository (owner/name). Private repositories are rejected at runtime. */
  repository: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, "repository is owner/name")
    .optional(),
  links: z.array(Link).default([]),
  technologies: z.array(Id).default([]),
  skills: z.array(Id).default([]),
  experiences: z.array(Id).default([]),
  collaborators: z.array(z.strictObject({ name: z.string().min(1), url: z.url().optional() })).default([]),
});
export type Project = z.infer<typeof Project>;
