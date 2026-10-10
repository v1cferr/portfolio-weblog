import { z } from "zod";

import { entityBase, LocalizedText, PartialDate } from "./common";

export const SetupItem = z.strictObject({
  /** What the part is for, e.g. "Processor (CPU)". */
  role: LocalizedText,
  model: z.string().min(1),
  url: z.url().optional(),
  note: LocalizedText.optional(),
  since: PartialDate.optional(),
  until: PartialDate.optional(),
});

/** The workstation page; not part of the knowledge graph. */
export const Setup = z.strictObject({
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
});
export type Setup = z.infer<typeof Setup>;
