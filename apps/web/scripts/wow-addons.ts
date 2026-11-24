/**
 * Refreshes the vendored copy of the WoW add-on list:
 *
 *   pnpm --filter web wow:addons
 *
 * The /wow page reads the list from the dotfiles at runtime (once a day); this
 * copy is what it shows when GitHub does not answer, and what CI renders. It
 * keeps only the fields the page uses. Run it after adding add-ons, or let the
 * page catch up on its own: the copy only needs to be roughly current.
 */
import { writeFileSync } from "node:fs";

import { findContentRoot, loadWow } from "@workspace/content";

import { parseAddonSources } from "../src/lib/wow-addons";

const OUT = new URL("../src/generated/wow-addons.json", import.meta.url);

const sourcesUrl = loadWow(findContentRoot())?.addons?.sources;
if (sourcesUrl === undefined) {
  console.error("content/games/wow.yaml has no addons.sources URL.");
  process.exit(1);
}

const response = await fetch(sourcesUrl, { signal: AbortSignal.timeout(15_000) });
if (!response.ok) {
  console.error(`${sourcesUrl} answered ${String(response.status)}.`);
  process.exit(1);
}
const sources = parseAddonSources(await response.json());
if (sources === undefined) {
  console.error(`${sourcesUrl} is not an add-on list.`);
  process.exit(1);
}

const slim = Object.fromEntries(
  Object.entries(sources).map(([id, { source, repo, projectId, url }]) => [
    id,
    { source, ...(repo !== undefined && { repo }), ...(projectId !== undefined && { projectId }), ...(url !== undefined && { url }) },
  ])
);
writeFileSync(OUT, `${JSON.stringify(slim, null, 2)}\n`);
console.warn(`Wrote ${String(Object.keys(slim).length)} add-ons to src/generated/wow-addons.json.`);
