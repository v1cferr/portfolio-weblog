import { z } from "zod";

import { EditorialStatus, Id, LocalizedList, LocalizedText, Media, PartialDate, Visibility } from "./common";

/*
 * The tattoos page ("personal architecture"). Not entities: no relations, so
 * the file loads on its own, like the WoW page. Each tattoo says where it is,
 * when it was done (approximately, until the owner checks the photos) and what
 * it means, with the owner's own words kept verbatim.
 */

/** Which part of the year an approximate date falls in. */
export const YearPart = z.enum(["early", "mid", "late"]);
export type YearPart = z.infer<typeof YearPart>;

/**
 * When a tattoo was done. Precise once known (`on: 2023-11-18`); until then a
 * year with `approximate: true` and, optionally, the part of the year, shown
 * as "around late 2023". Never a made-up day.
 */
export const TattooDate = z
  .strictObject({
    on: PartialDate,
    approximate: z.boolean().default(false),
    part: YearPart.optional(),
  })
  .refine((value) => value.part === undefined || /^\d{4}$/.test(value.on), {
    message: "part (early, mid, late) only goes with a bare year",
    path: ["part"],
  });
export type TattooDate = z.infer<typeof TattooDate>;

/** The owner's own words, verbatim in the language they were written in; other languages get a labelled gloss. */
export const TattooQuote = z.strictObject({
  text: z.string().min(1),
  language: z.enum(["en-us", "pt-br", "zh-cn"]).default("pt-br"),
  gloss: LocalizedText.optional(),
});
export type TattooQuote = z.infer<typeof TattooQuote>;

/** `done` is on the skin; `idea` is only being considered and is never shown as an existing tattoo. */
export const TattooState = z.enum(["done", "idea"]);
export type TattooState = z.infer<typeof TattooState>;

export const Tattoo = z
  .strictObject({
    /** The card's anchor on /tattoos (`/tattoos#usb-trident`): once published, it never changes. */
    id: Id,
    state: TattooState,
    title: LocalizedText,
    /** Where the symbol comes from ("World of Warcraft", "Universal Serial Bus"). */
    origin: LocalizedText,
    /** Where it is on the body, or where it is being considered. */
    placement: LocalizedText,
    date: TattooDate.optional(),
    /** The central meaning, in one line. */
    meaning: LocalizedText,
    /** A few short paragraphs. */
    body: LocalizedList,
    /** Values the symbol stands for, shown as chips. */
    values: LocalizedList.optional(),
    quotes: z.array(TattooQuote).default([]),
    media: Media.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.state === "done" && value.date === undefined) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "a tattoo that is done needs a date (approximate is fine)" });
    }
    if (value.state === "idea" && (value.date !== undefined || value.media !== undefined)) {
      ctx.addIssue({ code: "custom", path: ["state"], message: "an idea has no date and no photo: it is not a tattoo yet" });
    }
  });
export type Tattoo = z.infer<typeof Tattoo>;

export const Tattoos = z
  .strictObject({
    status: EditorialStatus.default("published"),
    visibility: Visibility.default("public"),
    /** The line at the top of the page, in the owner's words. */
    manifesto: TattooQuote,
    /** Slug of the weblog post that tells the whole story; linked only while it is visible. */
    post: Id.optional(),
    tattoos: z.array(Tattoo).min(1),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.tattoos.forEach((tattoo, index) => {
      if (seen.has(tattoo.id)) ctx.addIssue({ code: "custom", path: ["tattoos", index, "id"], message: `duplicate id ${tattoo.id}` });
      seen.add(tattoo.id);
    });
  });
export type Tattoos = z.infer<typeof Tattoos>;
