import { z } from "zod";

import { EditorialStatus, LocalizedList, LocalizedText, Visibility } from "./common";

/** A full calendar day, YYYY-MM-DD: a "now" update is written on a known day. */
export const Day = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "dates are YYYY-MM-DD")
  .refine((value) => {
    const [y = 0, m = 0, d = 0] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }, "not a real calendar date");
export type Day = z.infer<typeof Day>;

/** Bullets in at least one locale. */
const Items = LocalizedList.refine(
  (value) => Object.values(value).some((list) => list.length > 0),
  "at least one locale needs at least one item"
);

/**
 * One update of the "now" log (content/now/<YYYY-MM-DD>.yaml). Only what the
 * owner writes by hand lives here; the current role, the active projects and
 * the latest post are derived from the rest of the content when the site is
 * built, so they never go stale in a YAML file.
 */
export const NowEntry = z.strictObject({
  date: Day,
  status: EditorialStatus.default("published"),
  visibility: Visibility.default("public"),
  /** A short handwritten intro, shown above the bullets. */
  note: LocalizedText.optional(),
  items: Items,
  /** Where the owner is, as they want it written. */
  place: z.string().min(1).optional(),
});
export type NowEntry = z.infer<typeof NowEntry>;

/** What comes next (content/now/next.yaml): plans, not promises. */
export const NextPlans = z.strictObject({
  updatedAt: Day,
  status: EditorialStatus.default("published"),
  visibility: Visibility.default("public"),
  note: LocalizedText.optional(),
  items: Items,
});
export type NextPlans = z.infer<typeof NextPlans>;
