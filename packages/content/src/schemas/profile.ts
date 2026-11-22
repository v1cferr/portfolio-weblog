import { z } from "zod";

import { entityBase, Id, Link, LocalizedList, LocalizedText } from "./common";

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
  /** "What drives me" on the About page: why this work, in the owner's words. One paragraph per entry. */
  motivation: LocalizedList.optional(),
  /** "How I work": short principles, one per entry. */
  principles: LocalizedList.optional(),
  /** What the owner is studying or reading now, for the About page's "Now" card. */
  studying: LocalizedList.optional(),
  /** The career arc in a few steps, each pointing at the entity that shows it. */
  trajectory: z.array(z.strictObject({ label: LocalizedText, ref: Id.optional() })).default([]),
  location: z.string().optional(),
  /** Path under apps/web/public; must be stripped of EXIF metadata. */
  photo: z.string().startsWith("/").optional(),
  links: z.array(Link).default([]),
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
