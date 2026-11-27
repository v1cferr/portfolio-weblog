import "server-only";

import path from "node:path";

import { type ContentRegistry, loadRegistry } from "@workspace/content";

import { SHOWS_REVIEW } from "./preview";

/** apps/web → repository root → content. Statically scoped so tracing stays narrow. */
export const CONTENT_ROOT = path.join(process.cwd(), "..", "..", "content");

let registry: ContentRegistry | undefined;

/**
 * The public content registry. Built once per server process; in development
 * it is rebuilt on every call so edits to content/ show up without a restart.
 * Only published, public content is reachable through it, plus content in
 * review on preview deployments (lib/preview.ts).
 */
export function getContent(): ContentRegistry {
  if (process.env.NODE_ENV === "development") return loadRegistry(CONTENT_ROOT, { includeReview: SHOWS_REVIEW });
  registry ??= loadRegistry(CONTENT_ROOT, { includeReview: SHOWS_REVIEW });
  return registry;
}
