import "server-only";

import { type Decision, loadDecisions } from "@workspace/content";

import { CONTENT_ROOT } from "./content";

let decisions: Decision[] | undefined;

/**
 * The architecture decision records (docs/decisions/), newest first, with
 * their plain-language summaries (content/decisions.yaml). Read at build time;
 * in development they are re-read on every call, like the content registry.
 */
export function getDecisions(): Decision[] {
  if (process.env.NODE_ENV === "development") return loadDecisions(CONTENT_ROOT);
  decisions ??= loadDecisions(CONTENT_ROOT);
  return decisions;
}

export function getDecision(number: string): Decision | undefined {
  return getDecisions().find((decision) => decision.number === number);
}
