/**
 * Vendors GitHub's language colours into src/generated/linguist-colors.json:
 *
 *   pnpm --filter web linguist:colors            from the pinned linguist release
 *   pnpm --filter web linguist:colors v9.8.0     from another release tag
 *
 * The colours come from github-linguist's languages.yml (MIT), the file
 * GitHub itself draws repository language bars with. The site never fetches
 * them at runtime: the map is committed, and refreshing it is a reviewed diff.
 * Every language with a colour is kept (a few kilobytes, read only on the
 * server), so a repository that starts using a new language still gets its
 * colour without a code change.
 */
import { writeFileSync } from "node:fs";

import { parse } from "yaml";
import { z } from "zod";

const DEFAULT_TAG = "v9.7.0";
const tag = process.argv[2] ?? DEFAULT_TAG;
if (!/^v\d+\.\d+\.\d+$/.test(tag)) throw new Error(`not a release tag: ${tag}`);

const source = `https://raw.githubusercontent.com/github-linguist/linguist/${tag}/lib/linguist/languages.yml`;
const OUT = new URL("../src/generated/linguist-colors.json", import.meta.url);

const response = await fetch(source);
if (!response.ok) throw new Error(`${source} answered ${String(response.status)}`);
const languages = z
  .record(
    z.string(),
    z
      .object({
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
      })
      .loose()
  )
  .parse(parse(await response.text()));

const colors = Object.fromEntries(
  Object.entries(languages)
    .flatMap(([name, language]) => (language.color === undefined ? [] : [[name, language.color.toLowerCase()] as const]))
    .sort(([a], [b]) => a.localeCompare(b, "en"))
);

writeFileSync(OUT, `${JSON.stringify({ source, license: "MIT (github-linguist/linguist)", colors }, null, 2)}\n`);
process.stdout.write(`Wrote ${String(Object.keys(colors).length)} colours from linguist ${tag}.\n`);
