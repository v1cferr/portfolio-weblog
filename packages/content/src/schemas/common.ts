import { z } from "zod";

export const LOCALES = ["en-us", "pt-br", "zh-cn"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en-us";

/** Stable identifier: lowercase kebab-case. Once published, an id never changes. */
export const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ids are lowercase kebab-case (a-z, 0-9, single dashes)");

/**
 * A date with only the precision that is actually known: "2023", "2023-07" or
 * "2023-07-15". Career history rarely has exact days, and inventing them would
 * be inventing facts.
 */
export const PartialDate = z.preprocess(
  // YAML reads an unquoted `2023` as a number; a bare year is still a date here.
  (value) => (typeof value === "number" && Number.isInteger(value) ? String(value) : value),
  z
    .string()
    .regex(/^\d{4}(?:-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?)?$/, "dates are YYYY, YYYY-MM or YYYY-MM-DD")
    .refine((value) => {
      const [y, m, d] = value.split("-").map(Number);
      if (y === undefined || m === undefined || d === undefined) return true;
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
    }, "not a real calendar date")
);
export type PartialDate = z.infer<typeof PartialDate>;

/** Editorial lifecycle. Only `published` content can ever reach a public surface. */
export const EditorialStatus = z.enum(["draft", "review", "published"]);
export type EditorialStatus = z.infer<typeof EditorialStatus>;

/** Who may see the entity. `private` content stays in Git and is never rendered. */
export const Visibility = z.enum(["public", "private"]);
export type Visibility = z.infer<typeof Visibility>;

/** A string in one or more locales; at least one must be present. */
export const LocalizedText = z
  .strictObject({
    "en-us": z.string().min(1).optional(),
    "pt-br": z.string().min(1).optional(),
    "zh-cn": z.string().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "at least one locale is required");
export type LocalizedText = z.infer<typeof LocalizedText>;

/** A list of strings per locale (responsibilities, learnings, ...). */
export const LocalizedList = z.strictObject({
  "en-us": z.array(z.string().min(1)).optional(),
  "pt-br": z.array(z.string().min(1)).optional(),
  "zh-cn": z.array(z.string().min(1)).optional(),
});
export type LocalizedList = z.infer<typeof LocalizedList>;

export const Link = z.strictObject({
  label: z.string().min(1),
  url: z.url({ protocol: /^https?$|^mailto$/ }),
  kind: z.enum(["website", "repository", "demo", "article", "profile", "email", "certificate", "other"]).default("other"),
});
export type Link = z.infer<typeof Link>;

/**
 * A claim that exists somewhere (v1 site, notes) but has not been verified for
 * publication. Kept for the editor; no renderer ever reads this field.
 */
export const PendingReview = z.strictObject({
  claim: z.string().min(1),
  source: z.string().min(1),
  note: z.string().optional(),
});
export type PendingReview = z.infer<typeof PendingReview>;

/** Fields every entity carries; spread into each entity's object schema. */
export const entityBase = {
  id: Id,
  status: EditorialStatus.default("published"),
  visibility: Visibility.default("public"),
  pendingReview: z.array(PendingReview).default([]),
};
