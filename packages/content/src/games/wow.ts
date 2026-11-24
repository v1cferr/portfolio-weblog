import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse as parseYaml } from "yaml";

import type { ContentIssue } from "../loaders/errors";
import { ContentValidationError } from "../loaders/errors";
import { Wow } from "../schemas";

/** Where the World of Warcraft page's content lives, relative to the content root. */
export const WOW_FILE = "games/wow.yaml";

export interface WowLoadResult {
  wow: Wow | undefined;
  issues: ContentIssue[];
}

/** Reads content/games/wow.yaml. Never throws for invalid content: problems come back as issues. */
export function loadWowContent(root: string): WowLoadResult {
  const file = path.join(root, WOW_FILE);
  if (!existsSync(file)) return { wow: undefined, issues: [] };
  let data: unknown;
  try {
    data = parseYaml(readFileSync(file, "utf8")) as unknown;
  } catch (error) {
    return { wow: undefined, issues: [{ file: WOW_FILE, message: `invalid YAML: ${(error as Error).message}` }] };
  }
  const result = Wow.safeParse(data);
  if (result.success) return { wow: result.data, issues: [] };
  return {
    wow: undefined,
    issues: [
      {
        file: WOW_FILE,
        message: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; "),
      },
    ],
  };
}

/** Only what a public page may show: the page itself must be published and public, and so must each character. */
export function publicWow(wow: Wow | undefined): Wow | undefined {
  if (wow === undefined || wow.status !== "published" || wow.visibility !== "public") return undefined;
  return { ...wow, characters: wow.characters.filter((character) => character.visibility === "public") };
}

/** Loads the public page content; throws with every problem when the file is invalid. */
export function loadWow(root: string): Wow | undefined {
  const { wow, issues } = loadWowContent(root);
  if (issues.length > 0) throw new ContentValidationError(issues);
  return publicWow(wow);
}
