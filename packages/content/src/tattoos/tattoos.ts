import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse as parseYaml } from "yaml";

import type { ContentIssue } from "../loaders/errors";
import { ContentValidationError } from "../loaders/errors";
import type { MediaReference } from "../media";
import { Tattoos } from "../schemas";

/** Where the tattoos page's content lives, relative to the content root. */
export const TATTOOS_FILE = "profile/tattoos.yaml";

export interface TattoosLoadResult {
  tattoos: Tattoos | undefined;
  issues: ContentIssue[];
}

/** Reads content/profile/tattoos.yaml. Never throws for invalid content: problems come back as issues. */
export function loadTattoosContent(root: string): TattoosLoadResult {
  const file = path.join(root, TATTOOS_FILE);
  if (!existsSync(file)) return { tattoos: undefined, issues: [] };
  let data: unknown;
  try {
    data = parseYaml(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    return { tattoos: undefined, issues: [{ file: TATTOOS_FILE, message: `invalid YAML: ${(error as Error).message}` }] };
  }
  const result = Tattoos.safeParse(data);
  if (result.success) return { tattoos: result.data, issues: [] };
  return {
    tattoos: undefined,
    issues: [
      {
        file: TATTOOS_FILE,
        message: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; "),
      },
    ],
  };
}

/**
 * Only what a public page may show: the page must be public and published, or
 * in review when `includeReview` is set (preview deployments, ADR 0019).
 */
export function publicTattoos(tattoos: Tattoos | undefined, { includeReview = false } = {}): Tattoos | undefined {
  if (tattoos === undefined || tattoos.visibility !== "public") return undefined;
  if (tattoos.status === "published" || (includeReview && tattoos.status === "review")) return tattoos;
  return undefined;
}

/** Loads the public page content; throws with every problem when the file is invalid. */
export function loadTattoos(root: string, options: { includeReview?: boolean } = {}): Tattoos | undefined {
  const { tattoos, issues } = loadTattoosContent(root);
  if (issues.length > 0) throw new ContentValidationError(issues);
  return publicTattoos(tattoos, options);
}

/** The photos the page references, for content:check. */
export function tattooMedia(tattoos: Tattoos | undefined): MediaReference[] {
  return (tattoos?.tattoos ?? []).flatMap(({ media }) =>
    media === undefined ? [] : [{ src: media.src, width: media.width, height: media.height, file: TATTOOS_FILE }]
  );
}
