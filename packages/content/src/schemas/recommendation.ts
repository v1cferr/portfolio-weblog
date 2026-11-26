import { z } from "zod";

import { entityBase, Id, LOCALES, LocalizedList, LocalizedText, PartialDate } from "./common";

/*
 * Recommendations other people wrote about the owner (content/recommendations/<id>.yaml),
 * published with their permission. The text in the language it was written in is
 * kept verbatim; other languages are translations and are labelled as such.
 */

/** How the recommender knows the owner, from the owner's side ("my manager", "my teacher"). */
export const RecommendationRelationKind = z.enum(["manager", "teammate", "teacher", "classmate"]);
export type RecommendationRelationKind = z.infer<typeof RecommendationRelationKind>;

export const RecommendationRelation = z.strictObject({
  kind: RecommendationRelationKind,
  /** The relation in the owner's words, as the card says it ("my direct manager at Xmart"). */
  label: LocalizedText,
  /** Where they met: its logo is shown with the card. */
  organization: Id,
  /** The job they shared, when there is one on the site. */
  experience: Id.optional(),
  /** The course they shared, when there is one on the site. */
  education: Id.optional(),
});
export type RecommendationRelation = z.infer<typeof RecommendationRelation>;

export const Recommendation = z
  .strictObject({
    ...entityBase,
    /** The recommender's name, as on their profile. */
    name: z.string().min(1),
    /** A short form of the recommender's headline when the recommendation was read. */
    headline: LocalizedText,
    relation: RecommendationRelation,
    /** The day the recommendation was given. */
    date: PartialDate,
    /** The language the recommender wrote in; that text is verbatim, the others are translations. */
    language: z.enum(LOCALES),
    /** Where it can be read in the original (the owner's recommendations page). */
    url: z.url({ protocol: /^https$/ }),
    /** The full text, one paragraph per entry. */
    text: LocalizedList,
    /**
     * A short quote for the home page: verbatim pieces of `text` in the same
     * locale, joined by "…" where something was cut. content:check holds it to that.
     */
    excerpt: LocalizedText.optional(),
    /** Position on the home page (1 first); unset keeps it to the About page. */
    featured: z.int().min(1).optional(),
    /**
     * The recommender's photo, a path under apps/web/public/recommendations/.
     * Without it the card shows their initials.
     */
    photo: z
      .string()
      .regex(/^\/recommendations\/[\w.-]+\.(?:jpe?g|png|webp|avif)$/i, "photo is /recommendations/<file>.(jpg|png|webp|avif)")
      .optional(),
  })
  .refine((value) => (value.text[value.language]?.length ?? 0) > 0, {
    message: "the text must include the original language",
    path: ["text"],
  })
  .refine((value) => value.featured === undefined || value.excerpt !== undefined, {
    message: "a featured recommendation needs an excerpt",
    path: ["excerpt"],
  });
export type Recommendation = z.infer<typeof Recommendation>;

/**
 * The pieces of an excerpt that must appear word for word in the text: the
 * excerpt split at "…" (an ellipsis marks a cut), without surrounding quotes.
 */
export function excerptPieces(excerpt: string): string[] {
  return excerpt
    .split("…")
    .map((piece) => piece.trim())
    .filter((piece) => piece !== "");
}
