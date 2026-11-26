import { z } from "zod";

import { entityBase, Id, LocalizedText, PartialDate, Source } from "./common";

/**
 * A stretch of time between or around jobs (LinkedIn's "career break"): a
 * move, a study period. It has no organization, so it is not an experience:
 * it never counts as a job, never moves the years in IT and has no page. It
 * shows on the timeline as a marker on the career lane.
 */
export const CareerBreak = z.strictObject({
  ...entityBase,
  /** The kind of break, as LinkedIn names it. */
  kind: z.enum(["relocation"]),
  /** Short label for the timeline, e.g. "Moved to São Carlos". */
  title: LocalizedText,
  start: PartialDate,
  /** Omitted while the break is ongoing. */
  end: PartialDate.optional(),
  /** For a relocation: the city left and the city moved to. */
  move: z.strictObject({ from: z.string().min(1), to: z.string().min(1) }).optional(),
  summary: LocalizedText,
  /** Experiences that went on during the break, e.g. a remote freelance position. */
  overlaps: z.array(Id).default([]),
  sources: z.array(Source).default([]),
});
export type CareerBreak = z.infer<typeof CareerBreak>;
