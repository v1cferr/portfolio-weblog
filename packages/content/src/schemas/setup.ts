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
  /**
   * A photo of the part: the owner's own, or the manufacturer's when its press
   * terms allow reuse, with `credit`. Shown as a thumbnail that opens the
   * lightbox; a part without one shows just its card.
   */
  media: Media.extend({
    /** Who made the image when it is not the owner's, linked to where its terms are. */
    credit: z.strictObject({ label: z.string().min(1), url: z.url({ protocol: /^https$/ }) }).optional(),
  }).optional(),
});

/** A VS Code extension, as `code --list-extensions` names it (`publisher.name`). */
export const VscodeExtension = z.strictObject({
  id: z
    .string()
    .regex(
      /^[a-z0-9][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*$/,
      "an extension id is publisher.name in lowercase, as code --list-extensions prints it"
    ),
  /** The display name on the Marketplace. */
  name: z.string().min(1),
  /** `si:`, `dv:` or `lucide:` reference; the official logo of what the extension is for. */
  icon: z.string().optional(),
  /** Where it lives when it is not on the Marketplace (a local extension in the dotfiles). */
  url: z.url().optional(),
});
export type VscodeExtension = z.infer<typeof VscodeExtension>;

/** The anchor of an extension on /setup: `vscode-` plus its id with dots as dashes. */
export function vscodeExtensionAnchor(id: string): string {
  return `vscode-${id.replaceAll(".", "-")}`;
}

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
    /**
     * The VS Code extensions installed, copied from the dotfiles' mirror
     * (`code --list-extensions`), grouped by what they are for.
     */
    vscodeExtensions: z
      .strictObject({
        /** The mirror the list was copied from. */
        source: z.url({ protocol: /^https$/ }),
        /** When the mirror was last updated, as copied here. */
        syncedAt: PartialDate,
        groups: z
          .array(
            z.strictObject({
              id: Id,
              title: LocalizedText,
              items: z.array(VscodeExtension).min(1),
            })
          )
          .min(1),
      })
      .optional(),
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
    // Extension anchors share the page with the parts: none may repeat, and no extension may be listed twice.
    setup.vscodeExtensions?.groups.forEach((group, g) => {
      const heading = `vscode-${group.id}`;
      if (seen.has(heading))
        ctx.addIssue({ code: "custom", path: ["vscodeExtensions", "groups", g, "id"], message: `duplicate anchor id "${heading}"` });
      seen.add(heading);
      group.items.forEach((item, i) => {
        const anchor = vscodeExtensionAnchor(item.id);
        if (seen.has(anchor)) {
          ctx.addIssue({
            code: "custom",
            path: ["vscodeExtensions", "groups", g, "items", i, "id"],
            message: `duplicate extension or anchor "${anchor}"`,
          });
        }
        seen.add(anchor);
      });
    });
  });
export type Setup = z.infer<typeof Setup>;
