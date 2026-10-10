import { z } from "zod";

import { entityBase, Id, LocalizedText } from "./common";

export const TechnologyCategory = z.enum([
  "language",
  "framework",
  "library",
  "database",
  "platform",
  "infrastructure",
  "tool",
  "security",
  "ai",
  "practice",
]);

export const Technology = z.strictObject({
  ...entityBase,
  name: z.string().min(1),
  category: TechnologyCategory,
  url: z.url().optional(),
});
export type Technology = z.infer<typeof Technology>;

/** A capability that is broader than one tool (e.g. "networking", "CI/CD"). */
export const Skill = z.strictObject({
  ...entityBase,
  name: LocalizedText,
  description: LocalizedText.optional(),
  technologies: z.array(Id).default([]),
});
export type Skill = z.infer<typeof Skill>;

export const Organization = z.strictObject({
  ...entityBase,
  name: z.string().min(1),
  kind: z.enum(["company", "university", "school", "program", "community", "platform", "self-employed"]),
  url: z.url().optional(),
  /** Path under apps/web/public. */
  logo: z.string().startsWith("/").optional(),
  location: z.string().optional(),
  description: LocalizedText.optional(),
});
export type Organization = z.infer<typeof Organization>;
