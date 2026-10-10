import { z } from "zod";

import { EditorialStatus, Id, PartialDate, Visibility } from "./common";

export const PostCategory = z.enum(["engineering", "infrastructure", "ai", "career", "journal"]);
export type PostCategory = z.infer<typeof PostCategory>;

/**
 * Frontmatter of content/weblog/<slug>/<locale>.mdx. The slug (directory) is
 * the stable id shared by every translation of a post.
 */
export const PostFrontmatter = z.strictObject({
  title: z.string().min(1),
  summary: z.string().min(1),
  status: EditorialStatus,
  visibility: Visibility.default("public"),
  publishedAt: PartialDate.optional(),
  updatedAt: PartialDate.optional(),
  category: PostCategory,
  tags: z.array(Id).default([]),
  projects: z.array(Id).default([]),
  experiences: z.array(Id).default([]),
  technologies: z.array(Id).default([]),
});
export type PostFrontmatter = z.infer<typeof PostFrontmatter>;
