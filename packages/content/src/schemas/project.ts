import { z } from "zod";

import { entityBase, Id, Link, LocalizedList, LocalizedText, mediaFields, PartialDate } from "./common";

/**
 * Editorial lifecycle of a project, set by hand. A quiet repository does not
 * make a project abandoned, so this is never inferred from commit activity.
 */
export const ProjectState = z.enum(["active", "maintained", "stable", "experimental", "paused", "historical", "archived"]);
export type ProjectState = z.infer<typeof ProjectState>;

export const ProjectCategory = z.enum(["personal", "professional", "academic", "study", "challenge"]);
export type ProjectCategory = z.infer<typeof ProjectCategory>;

const HttpUrl = z.url({ protocol: /^https?$/ });

/** One architectural choice, told as "chose X over Y because…, at the cost of…". */
export const CaseStudyDecision = z.strictObject({
  title: LocalizedText,
  chosen: LocalizedText,
  /** What was set aside; at least one, or it was not a decision. */
  alternatives: LocalizedList.refine(
    (list) => Object.values(list).some((items) => items.length > 0),
    "a decision names at least one alternative"
  ),
  why: LocalizedText,
  cost: LocalizedText,
  /** The ADR that records it, when there is one. */
  adr: HttpUrl.optional(),
});
export type CaseStudyDecision = z.infer<typeof CaseStudyDecision>;

/**
 * The long form of a project, in two layers: a TL;DR (problem, outcome, role)
 * read on the first screen, then a deep dive. Only `problem`, `role` and
 * `decisions` are required, and the page renders only what exists: an outcome
 * or a lesson the owner has not stated stays out instead of being guessed
 * (ADR 0014).
 */
export const CaseStudy = z.strictObject({
  problem: LocalizedText,
  outcome: LocalizedText.optional(),
  /** "Solo", "Solo, for a client", ... */
  role: LocalizedText,
  motivation: LocalizedText.optional(),
  constraints: LocalizedList.optional(),
  nonGoals: LocalizedList.optional(),
  approach: LocalizedText.optional(),
  decisions: z.array(CaseStudyDecision).min(1).max(3),
  /** Quality gates every change passes, in plain text. */
  quality: LocalizedList.optional(),
  /** How it was built, including the AI disclosure. */
  howBuilt: LocalizedText.optional(),
  lessons: LocalizedList.optional(),
  next: LocalizedList.optional(),
  /** Where the project's architecture decision records live. */
  adrs: HttpUrl.optional(),
});
export type CaseStudy = z.infer<typeof CaseStudy>;

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
  caseStudy: CaseStudy.optional(),
  collaborators: z.array(z.strictObject({ name: z.string().min(1), url: z.url().optional() })).default([]),
  ...mediaFields,
});
export type Project = z.infer<typeof Project>;
