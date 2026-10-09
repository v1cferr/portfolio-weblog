import { z } from "zod";

import { entityBase, Id, Link, LocalizedList, LocalizedText, PartialDate } from "./common";

export const Education = z.strictObject({
  ...entityBase,
  institution: Id,
  kind: z.enum(["degree", "technical", "bootcamp", "course", "self-study"]),
  title: LocalizedText,
  field: LocalizedText.optional(),
  /** Omitted when not confirmed. */
  state: z.enum(["ongoing", "completed", "paused", "incomplete"]).optional(),
  start: PartialDate.optional(),
  end: PartialDate.optional(),
  summary: LocalizedText.optional(),
  learnings: LocalizedList.default({}),
  technologies: z.array(Id).default([]),
  projects: z.array(Id).default([]),
  evidence: z.array(Link).default([]),
});
export type Education = z.infer<typeof Education>;

export const Certification = z.strictObject({
  ...entityBase,
  name: z.string().min(1),
  issuer: Id,
  issuedAt: PartialDate,
  expiresAt: PartialDate.optional(),
  credentialUrl: z.url().optional(),
  technologies: z.array(Id).default([]),
});
export type Certification = z.infer<typeof Certification>;
