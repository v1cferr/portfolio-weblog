import "server-only";

import { loadWow, type Wow, type WowCharacter } from "@workspace/content";

import snapshot from "@/generated/wow-addons.json";

import { WOW_REVALIDATE_SECONDS } from "./blizzard";
import { CONTENT_ROOT } from "./content";
import { type AddonGroup, groupAddons, parseAddonSources } from "./wow-addons";

let wow: Wow | undefined;
let loaded = false;

/** The public /wow content; rebuilt on every call in development, like the registry. */
export function getWow(): Wow | undefined {
  if (process.env.NODE_ENV === "development") return loadWow(CONTENT_ROOT);
  if (!loaded) {
    wow = loadWow(CONTENT_ROOT);
    loaded = true;
  }
  return wow;
}

/** Mains first, then highest level, then by name. */
export function sortCharacters<T extends WowCharacter>(characters: readonly T[]): T[] {
  return [...characters].sort((a, b) => Number(b.main) - Number(a.main) || (b.level ?? 0) - (a.level ?? 0) || a.name.localeCompare(b.name));
}

export interface AddonList {
  groups: AddonGroup[];
  total: number;
  /** "live" when read from the dotfiles today, "snapshot" when from the copy vendored in the repository. */
  source: "live" | "snapshot";
}

/**
 * The add-on list from the dotfiles, read at most once a day, grouped by the
 * content. When GitHub does not answer, the vendored copy
 * (src/generated/wow-addons.json, `pnpm --filter web wow:addons`) stands in.
 */
export async function getAddonList(addons: NonNullable<Wow["addons"]>): Promise<AddonList> {
  let sources = undefined;
  let source: AddonList["source"] = "snapshot";
  try {
    const response = await fetch(addons.sources, {
      next: { revalidate: WOW_REVALIDATE_SECONDS, tags: ["wow"] },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) sources = parseAddonSources(await response.json());
    if (sources !== undefined) source = "live";
    else console.warn(`WoW add-on list unavailable (${String(response.status)}); showing the vendored copy`);
  } catch (error) {
    console.warn(`WoW add-on list unavailable (${error instanceof Error ? error.message : "error"}); showing the vendored copy`);
  }
  sources ??= parseAddonSources(snapshot) ?? {};
  const groups = groupAddons(sources, addons.groups, addons.names);
  return { groups, total: groups.reduce((sum, group) => sum + group.addons.length, 0), source };
}
