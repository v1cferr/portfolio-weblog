import { z } from "zod";

import { EditorialStatus, PartialDate, Visibility } from "./common";

/**
 * Frontmatter of content/pages/<slug>/<locale>.mdx: a standalone page in
 * prose (the colophon), outside the entity graph. `updatedAt` is required, as
 * the page shows it as the date it was last tended.
 */
export const PageFrontmatter = z.strictObject({
  title: z.string().min(1),
  summary: z.string().min(1),
  status: EditorialStatus.default("published"),
  visibility: Visibility.default("public"),
  updatedAt: PartialDate,
});
export type PageFrontmatter = z.infer<typeof PageFrontmatter>;
