import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse as parseYaml } from "yaml";

import type { ContentIssue } from "../loaders/errors";
import { ContentValidationError } from "../loaders/errors";
import { DecisionSummaries, type LocalizedText } from "../schemas";

/*
 * The architecture decision records (docs/decisions/NNNN-<slug>.md), read as
 * the files are, plus their plain-language summaries (content/decisions.yaml).
 * The records are documentation first: they are never rewritten for the site,
 * so the parser follows their format instead of asking for frontmatter.
 *
 *   # 0004. Title
 *
 *   - Status: accepted (2026-10-09, decided with the owner); partly superseded by
 *     [0008](0008-spotify-now-playing.md) for Spotify
 *   - Jira: PWL-98
 *
 *   ## Context
 *   ...
 *   ## Revision (2026-11-22, tap to open)
 */

export const DECISION_STATUSES = ["proposed", "accepted", "rejected", "deprecated", "superseded"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export interface DecisionRevision {
  /** YYYY-MM-DD. */
  date: string;
  /** What the revision is about, from its heading ("tap to open"); may be empty. */
  label: string;
}

export interface Decision {
  /** Four digits, as in the file name: "0006". */
  number: string;
  /** The file name without .md: "0006-local-search-before-ai". */
  slug: string;
  /** Path from the repository root: "docs/decisions/0006-local-search-before-ai.md". */
  file: string;
  title: string;
  status: DecisionStatus;
  /** The day the status was set, YYYY-MM-DD. */
  date: string;
  /** The ADRs that supersede this one, wholly or in part. */
  supersededBy: string[];
  /** True when only part of the decision was superseded. */
  partlySuperseded: boolean;
  /** "## Revision (YYYY-MM-DD, …)" sections, in file order. */
  revisions: DecisionRevision[];
  /** The Markdown after the title, status list included. */
  body: string;
  /** Why it matters, in plain language (content/decisions.yaml). */
  why: LocalizedText | undefined;
}

export interface DecisionsLoadResult {
  /** Newest (highest number) first. */
  decisions: Decision[];
  issues: ContentIssue[];
}

const FILE = /^(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const TITLE = /^# (\d{4})\. (.+)$/m;
const STATUS = /^(\w+) \((\d{4}-\d{2}-\d{2})(?:, [^)]*)?\)(.*)$/s;
const REVISION = /^## Revision \((\d{4}-\d{2}-\d{2})(?:, ?(.*))?\)\s*$/gm;

/** The repository-relative folder of the records. */
export const DECISIONS_DIR = "docs/decisions";

/** docs/decisions/, next to the content root (both sit at the repository root). */
export function decisionsDir(contentRoot: string): string {
  return path.join(contentRoot, "..", DECISIONS_DIR);
}

/** The "- Status:" item with its continuation lines, joined into one line. */
function statusText(markdown: string): string | undefined {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line.startsWith("- Status:"));
  if (start === -1) return undefined;
  const parts = [lines[start]?.slice("- Status:".length).trim() ?? ""];
  for (const line of lines.slice(start + 1)) {
    if (!/^\s+\S/.test(line)) break;
    parts.push(line.trim());
  }
  return parts.join(" ");
}

type Parsed = Omit<Decision, "why">;

/** Parses one record; returns the problems instead of throwing. */
export function parseDecision(fileName: string, markdown: string): { decision?: Parsed; issues: string[] } {
  const issues: string[] = [];
  const number = FILE.exec(fileName)?.[1];
  if (number === undefined) return { issues: ["ADR files are named NNNN-kebab-case-title.md"] };

  const heading = TITLE.exec(markdown);
  if (heading?.[1] === undefined || heading[2] === undefined) issues.push('the first heading must be "# NNNN. Title"');
  else if (heading[1] !== number) issues.push(`the heading says ${heading[1]}, the file name ${number}`);

  const text = statusText(markdown);
  const status = text === undefined ? undefined : STATUS.exec(text);
  const word = status?.[1]?.toLowerCase();
  if (status === null || status === undefined || word === undefined) {
    issues.push('missing or malformed "- Status: <status> (YYYY-MM-DD)" line');
  } else if (!(DECISION_STATUSES as readonly string[]).includes(word)) {
    issues.push(`unknown status "${word}" (expected ${DECISION_STATUSES.join(", ")})`);
  }
  if (issues.length > 0 || heading === null || status === null || status === undefined) return { issues };

  const rest = status[3] ?? "";
  const supersededMention = /superseded by/i.exec(rest);
  const supersededBy =
    supersededMention === null ? [] : [...rest.slice(supersededMention.index).matchAll(/\[(\d{4})\]/g)].map((match) => match[1] ?? "");

  return {
    issues,
    decision: {
      number,
      slug: fileName.replace(/\.md$/, ""),
      file: `${DECISIONS_DIR}/${fileName}`,
      title: heading[2]?.trim() ?? "",
      status: word as DecisionStatus,
      date: status[2] ?? "",
      supersededBy,
      partlySuperseded: supersededMention !== null && /\bpart(?:ly|ially)\b/i.test(rest),
      revisions: [...markdown.matchAll(REVISION)].map((match) => ({ date: match[1] ?? "", label: match[2]?.trim() ?? "" })),
      body: markdown.slice(heading.index + heading[0].length).trim(),
    },
  };
}

/**
 * Reads every record and the summaries. Never throws for invalid files: the
 * problems come back as issues, so content:check can list them all.
 */
export function loadDecisionsContent(contentRoot: string): DecisionsLoadResult {
  const dir = decisionsDir(contentRoot);
  const issues: ContentIssue[] = [];
  const decisions: Decision[] = [];
  if (!existsSync(dir)) return { decisions, issues };

  const summariesFile = path.join(contentRoot, "decisions.yaml");
  let summaries: DecisionSummaries = {};
  if (existsSync(summariesFile)) {
    try {
      const result = DecisionSummaries.safeParse(parseYaml(readFileSync(summariesFile, "utf8")));
      if (result.success) summaries = result.data;
      else
        issues.push({
          file: "decisions.yaml",
          message: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; "),
        });
    } catch (error) {
      issues.push({ file: "decisions.yaml", message: `invalid YAML: ${(error as Error).message}` });
    }
  }

  for (const name of readdirSync(dir).sort()) {
    if (!/^\d/.test(name)) continue; // README.md and other notes
    const { decision, issues: problems } = parseDecision(name, readFileSync(path.join(dir, name), "utf8"));
    for (const message of problems) issues.push({ file: `../${DECISIONS_DIR}/${name}`, message });
    if (decision === undefined) continue;
    if (decisions.some((other) => other.number === decision.number)) {
      issues.push({ file: `../${DECISIONS_DIR}/${name}`, message: `ADR ${decision.number} is numbered twice` });
      continue;
    }
    const summary = summaries[decision.number];
    if (summary === undefined) issues.push({ file: "decisions.yaml", message: `ADR ${decision.number} has no summary` });
    decisions.push({ ...decision, why: summary?.why });
  }

  const numbers = new Set(decisions.map((decision) => decision.number));
  for (const key of Object.keys(summaries)) {
    if (!numbers.has(key)) issues.push({ file: "decisions.yaml", message: `${key}: no ADR has this number` });
  }
  for (const decision of decisions) {
    for (const by of decision.supersededBy) {
      if (!numbers.has(by)) issues.push({ file: decision.file, message: `superseded by ${by}, which does not exist` });
    }
  }

  decisions.sort((a, b) => b.number.localeCompare(a.number));
  return { decisions, issues };
}

/** Loads the records; throws with every problem when a file is invalid. */
export function loadDecisions(contentRoot: string): Decision[] {
  const { decisions, issues } = loadDecisionsContent(contentRoot);
  if (issues.length > 0) throw new ContentValidationError(issues);
  return decisions;
}
