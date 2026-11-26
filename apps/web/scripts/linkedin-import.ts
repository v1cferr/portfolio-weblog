/**
 * Brings the recommendations of a LinkedIn data export into
 * content/recommendations/ (docs/guides/linkedin-recommendations.md):
 *
 *   pnpm linkedin:import <path to the export .zip, or to Recommendations_Received.csv>
 *
 * New recommendations are written as drafts with a TODO for the owner's
 * fields; existing ones (matched by the recommender's name, as the file name)
 * get the synced fields refreshed (name, job title, company, date, original
 * text, visibility) and keep everything else. A changed original text marks
 * the translations as stale. Recommendations missing from the export are left
 * alone. Only the YAML is written, and the texts are never printed: the export
 * holds personal data and must not be committed.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { findContentRoot, loadContent } from "@workspace/content";

import { type ImportChange, mergeRecommendation, RECOMMENDATIONS_CSV, readRecommendations } from "../src/lib/linkedin-import";

// pnpm runs the script from apps/web; a relative path is relative to where the command was typed.
const input = process.argv[2] === undefined ? undefined : path.resolve(process.env.INIT_CWD ?? process.cwd(), process.argv[2]);
if (input === undefined || !existsSync(input)) {
  console.error("Usage: pnpm linkedin:import <LinkedIn data export .zip, or Recommendations_Received.csv>");
  process.exit(1);
}

/** The CSV, straight from the archive (unzip -p streams one member to stdout; nothing is extracted to disk). */
function readCsv(file: string): string {
  if (file.toLowerCase().endsWith(".csv")) return readFileSync(file, "utf8");
  try {
    return execFileSync("unzip", ["-p", file, RECOMMENDATIONS_CSV], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  } catch {
    console.error(`Could not read ${RECOMMENDATIONS_CSV} from ${file} (is unzip installed, and is this a LinkedIn data export?).`);
    process.exit(1);
  }
}

/** The file's text, or undefined when there is none (read directly, no exists-then-read race). */
function readIfPresent(file: string): string | undefined {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

const root = findContentRoot();
const dir = path.join(root, "recommendations");
mkdirSync(dir, { recursive: true });
/** New entries link to the owner's recommendations page, next to the LinkedIn profile in profile.yaml. */
const profileUrl = loadContent(root).content.profile?.value.links.find((link) => link.url.includes("linkedin.com/in/"))?.url;
if (profileUrl === undefined) {
  console.error("profile.yaml has no LinkedIn link to build the recommendations URL from.");
  process.exit(1);
}
const defaults = { url: `${profileUrl.replace(/\/$/, "")}/details/recommendations/`, language: "pt-br" };

const results: Record<ImportChange, string[]> = { added: [], updated: [], unchanged: [] };
for (const item of readRecommendations(readCsv(input))) {
  const file = path.join(dir, `${item.id}.yaml`);
  const source = readIfPresent(file);
  const { yaml, change } = mergeRecommendation(source, item, defaults);
  // A new file is created only if it still does not exist ("wx"), so a file that appeared meanwhile is never overwritten.
  if (change !== "unchanged") writeFileSync(file, yaml, { flag: change === "added" ? "wx" : "w" });
  results[change].push(item.id);
}

const mark = { added: "+", updated: "~", unchanged: "=" } as const;
for (const change of ["added", "updated", "unchanged"] as const) {
  for (const id of results[change]) console.warn(`${mark[change]} ${id}`);
}
console.warn(
  `${String(results.added.length)} new, ${String(results.updated.length)} updated, ${String(results.unchanged.length)} unchanged. ` +
    (results.added.length + results.updated.length > 0 ? "Review the diff, then run pnpm content:check." : "")
);
