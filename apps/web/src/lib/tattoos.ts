import "server-only";

import { loadTattoos, type Tattoos } from "@workspace/content";

import { CONTENT_ROOT } from "./content";
import { SHOWS_REVIEW } from "./preview";

let tattoos: Tattoos | undefined;
let loaded = false;

/**
 * The /tattoos content, or undefined while it is hidden (a draft, or in review
 * outside a preview deployment). Rebuilt on every call in development, like the
 * registry.
 */
export function getTattoos(): Tattoos | undefined {
  if (process.env.NODE_ENV === "development") return loadTattoos(CONTENT_ROOT, { includeReview: SHOWS_REVIEW });
  if (!loaded) {
    tattoos = loadTattoos(CONTENT_ROOT, { includeReview: SHOWS_REVIEW });
    loaded = true;
  }
  return tattoos;
}
