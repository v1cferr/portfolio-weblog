import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { parse as parseYaml } from "yaml";
import type { z } from "zod";

import type { ContentIssue } from "../loaders/errors";
import { ContentValidationError } from "../loaders/errors";
import { NextPlans, NowEntry } from "../schemas";

/*
 * The "now" log and the "next" plans (ADR 0013). They are a dated log, not
 * entities: no ids, no relations, so they load on their own instead of going
 * through the registry, and each update is one file named after its day.
 */

export interface NowLog {
  /** Newest first. */
  entries: NowEntry[];
  next: NextPlans | undefined;
}

export interface NowLoadResult {
  log: NowLog;
  issues: ContentIssue[];
}

const DAY_FILE = /^(\d{4}-\d{2}-\d{2})\.yaml$/;
const NEXT_FILE = "next.yaml";

/** Reads content/now/. Never throws for invalid content: problems come back as issues. */
export function loadNowContent(root: string): NowLoadResult {
  const dir = path.join(root, "now");
  const issues: ContentIssue[] = [];
  const log: NowLog = { entries: [], next: undefined };
  if (!existsSync(dir)) return { log, issues };

  function parse<T>(schema: z.ZodType<T>, file: string): T | undefined {
    const rel = path.relative(root, file);
    let data: unknown;
    try {
      data = parseYaml(readFileSync(file, "utf8")) as unknown;
    } catch (error) {
      issues.push({ file: rel, message: `invalid YAML: ${(error as Error).message}` });
      return undefined;
    }
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    issues.push({
      file: rel,
      message: result.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; "),
    });
    return undefined;
  }

  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".yaml")) continue;
    const file = path.join(dir, name);
    if (name === NEXT_FILE) {
      log.next = parse(NextPlans, file);
      continue;
    }
    const day = DAY_FILE.exec(name)?.[1];
    if (day === undefined) {
      issues.push({ file: path.relative(root, file), message: `now entries are named <YYYY-MM-DD>.yaml (or ${NEXT_FILE})` });
      continue;
    }
    const entry = parse(NowEntry, file);
    if (entry === undefined) continue;
    if (entry.date !== day) {
      issues.push({ file: path.relative(root, file), message: `date "${entry.date}" must match the file name "${day}"` });
      continue;
    }
    log.entries.push(entry);
  }
  log.entries.sort((a, b) => b.date.localeCompare(a.date));
  return { log, issues };
}

type Gated = { status: string; visibility: string };
const isPublic = (value: Gated) => value.status === "published" && value.visibility === "public";

/** Only published, public updates: what any public page may show. */
export function publicNow(log: NowLog): NowLog {
  return {
    entries: log.entries.filter(isPublic),
    next: log.next !== undefined && isPublic(log.next) ? log.next : undefined,
  };
}

/** Loads the public log; throws with every problem when the files are invalid. */
export function loadNow(root: string): NowLog {
  const { log, issues } = loadNowContent(root);
  if (issues.length > 0) throw new ContentValidationError(issues);
  return publicNow(log);
}

/** Whole days from `day` (YYYY-MM-DD) to `today`, in UTC; never negative. */
export function daysSince(day: string, today: Date): number {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  const then = Date.UTC(y, m - 1, d);
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.max(0, Math.round((now - then) / 86_400_000));
}

/** After this many days without an update, the log is shown as stale. */
export const NOW_STALE_AFTER_DAYS = 90;
