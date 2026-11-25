import { z } from "zod";

import { EditorialStatus, PartialDate, Visibility } from "./common";

/**
 * Frontmatter of content/experiences/<id>/story.<locale>.mdx: the optional
 * long-form story of one job, read after its page. The folder name is the
 * experience id; the story has no id of its own and is never referenced.
 */
export const StoryFrontmatter = z.strictObject({
  title: z.string().min(1),
  summary: z.string().min(1),
  status: EditorialStatus,
  visibility: Visibility.default("public"),
  /** Last time the text was revised. A story is about a past job, so it has no publication date. */
  updatedAt: PartialDate,
});
export type StoryFrontmatter = z.infer<typeof StoryFrontmatter>;
