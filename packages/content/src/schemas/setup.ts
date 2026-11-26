import { z } from "zod";

import { entityBase, Id, LocalizedText, Media, PartialDate } from "./common";

export const SetupItem = z.strictObject({
  /**
   * The item's anchor on /setup (`/setup#mousepad-redragon-alianca`): kind and
   * model in kebab-case, unique on the page. Links point at it, so it never
   * changes once published, even if the model text is edited.
   */
  id: Id,
  /** What the part is for, e.g. "Processor (CPU)". */
  role: LocalizedText,
  model: z.string().min(1),
  url: z.url().optional(),
  note: LocalizedText.optional(),
  since: PartialDate.optional(),
  until: PartialDate.optional(),
});

/** The workstation page; not part of the knowledge graph. */
export const Setup = z
  .strictObject({
    ...entityBase,
    updatedAt: PartialDate,
    groups: z
      .array(
        z.strictObject({
          id: z.string().min(1),
          title: LocalizedText,
          items: z.array(SetupItem).min(1),
        })
      )
      .min(1),
    /** The desk over the years, each photo dated; shown newest first. */
    photos: z.array(Media.extend({ date: PartialDate })).default([]),
  })
  .superRefine((setup, ctx) => {
    // Item ids are anchors on one page: they must not repeat, or collide with a group's `setup-<id>` heading.
    const seen = new Set(setup.groups.map((group) => `setup-${group.id}`));
    setup.groups.forEach((group, g) => {
      group.items.forEach((item, i) => {
        if (seen.has(item.id)) {
          ctx.addIssue({ code: "custom", path: ["groups", g, "items", i, "id"], message: `duplicate anchor id "${item.id}"` });
        }
        seen.add(item.id);
      });
    });
  });
export type Setup = z.infer<typeof Setup>;
