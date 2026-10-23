import { z } from "zod";

import { entityBase, Id, Link, LocalizedList, LocalizedText, mediaFields, PartialDate } from "./common";

export const EmploymentType = z.enum(["full-time", "part-time", "internship", "contract", "freelance", "apprenticeship", "volunteer"]);

export const Position = z.strictObject({
  title: LocalizedText,
  employmentType: EmploymentType.optional(),
  /** Required once the experience is published; may be unknown while in review. */
  start: PartialDate.optional(),
  /** Omitted while the position is current. */
  end: PartialDate.optional(),
  /** Short context for this position alone, e.g. why it was temporary. */
  note: LocalizedText.optional(),
  /** What this position added on top of the experience-wide responsibilities. */
  responsibilities: LocalizedList.optional(),
});
export type Position = z.infer<typeof Position>;

/**
 * Time at one organization. Several positions (intern → junior) belong to the
 * same experience so the progression stays visible.
 */
export const Experience = z.strictObject({
  ...entityBase,
  organization: Id,
  location: z.string().optional(),
  workMode: z.enum(["on-site", "hybrid", "remote"]).optional(),
  positions: z.array(Position).min(1),
  summary: LocalizedText,
  context: LocalizedText.optional(),
  responsibilities: LocalizedList.default({}),
  contributions: LocalizedList.default({}),
  learnings: LocalizedList.default({}),
  /** "What I would do differently today" (PWL-101). */
  hindsight: LocalizedText.optional(),
  /** Where this experience led in the trajectory. */
  impact: LocalizedText.optional(),
  technologies: z.array(Id).default([]),
  skills: z.array(Id).default([]),
  projects: z.array(Id).default([]),
  evidence: z.array(Link).default([]),
  ...mediaFields,
});
export type Experience = z.infer<typeof Experience>;
