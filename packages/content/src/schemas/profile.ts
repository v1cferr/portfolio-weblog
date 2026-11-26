import { z } from "zod";

import { entityBase, Id, Link, LocalizedList, LocalizedText, Media } from "./common";

export const Profile = z.strictObject({
  ...entityBase,
  name: z.string().min(1),
  handle: z.string().min(1),
  /** Other names the owner goes by (a professional nickname, a mark), for search engines and structured data. */
  aliases: z.array(z.string().min(1)).default([]),
  headline: LocalizedText,
  summary: LocalizedText,
  /** Longer narrative for the About page, one paragraph per entry. */
  about: LocalizedList.optional(),
  focus: LocalizedList.optional(),
  /** Short area labels shown under the headline on the home hero, e.g. "LLMOps". Not translated. */
  specialties: z.array(z.string().min(1)).default([]),
  /** The daily stack on the home hero: each entry is one chip, e.g. "Python/FastAPI", with its technologies' icons. */
  stack: z.array(z.strictObject({ label: z.string().min(1), technologies: z.array(Id).min(1) })).default([]),
  /** "What drives me" on the About page: why this work, in the owner's words. One paragraph per entry. */
  motivation: LocalizedList.optional(),
  /** "How I work": short principles, one per entry. */
  principles: LocalizedList.optional(),
  /** What the owner is studying or reading now, for the About page's "Now" card. */
  studying: LocalizedList.optional(),
  /** The career arc in a few steps, each pointing at the entity that shows it. */
  trajectory: z.array(z.strictObject({ label: LocalizedText, ref: Id.optional() })).default([]),
  location: z.string().optional(),
  /** The owner's pronouns, as they state them on LinkedIn; shown next to the handle on the home hero. */
  pronouns: LocalizedText.optional(),
  /** Spoken languages and the level in each, for the About page. */
  languages: z.array(z.strictObject({ name: LocalizedText, level: LocalizedText })).default([]),
  /** Path under apps/web/public; must be stripped of EXIF metadata. */
  photo: z.string().startsWith("/").optional(),
  links: z.array(Link).default([]),
  /**
   * Whether the owner is open to new work. The home hero shows a badge only when
   * `open` is true; the owner sets it, never a default.
   */
  availability: z.strictObject({ open: z.boolean(), note: LocalizedText.optional() }).optional(),
  /** Path under apps/web/public to the CV (a PDF). The home links to it only when set. */
  cv: z.string().startsWith("/").optional(),
  /**
   * "Curiosities" at the end of the About page: personal facts, each in the owner's
   * own words, optionally with a photo (opens in the lightbox) and a page on this site.
   */
  curiosities: z
    .array(
      z.strictObject({
        id: Id,
        text: LocalizedText,
        /** A path on this site that tells more, e.g. "/wow". */
        href: z.string().startsWith("/").optional(),
        media: Media.optional(),
      })
    )
    .default([]),
  quotes: z
    .array(
      z.strictObject({
        text: z.string().min(1),
        source: z.string().min(1),
        url: z.url().optional(),
        locale: z.enum(["en-us", "pt-br", "zh-cn"]),
      })
    )
    .default([]),
});
export type Profile = z.infer<typeof Profile>;
