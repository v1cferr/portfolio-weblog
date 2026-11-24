import type { LocalizedText, WowAddonGroup } from "@workspace/content";
import { z } from "zod";

/*
 * The owner's WoW Forever add-ons, as the dotfiles pin them for Nix
 * (pkgs/wow-addons/sources.json: name -> source, project id or repo, version,
 * zip url, hash). The page reads that file and arranges it with the groups in
 * content/games/wow.yaml. Pure, so it is unit-tested.
 */

const Source = z.looseObject({
  source: z.string(),
  repo: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/)
    .optional(),
  projectId: z.number().int().positive().optional(),
  url: z.string().optional(),
});
export const AddonSources = z.record(z.string().min(1), Source);
export type AddonSources = z.infer<typeof AddonSources>;

export interface Addon {
  id: string;
  name: string;
  /** The add-on's page: its GitHub repository or its CurseForge project. */
  href?: string;
  host: "github" | "curseforge" | "other";
}

export interface AddonGroup {
  /** "other" collects the add-ons no group names. */
  id: string;
  title?: LocalizedText;
  addons: Addon[];
}

/** Parses sources.json; undefined when it is not the expected shape. */
export function parseAddonSources(data: unknown): AddonSources | undefined {
  const parsed = AddonSources.safeParse(data);
  return parsed.success && Object.keys(parsed.data).length > 0 ? parsed.data : undefined;
}

/** Where a reader can learn about the add-on. */
export function addonHref(entry: AddonSources[string]): string | undefined {
  if (entry.source === "github" && entry.repo !== undefined) return `https://github.com/${entry.repo}`;
  if (entry.source === "curseforge" && entry.projectId !== undefined)
    return `https://www.curseforge.com/projects/${String(entry.projectId)}`;
  return undefined;
}

/**
 * The add-on's name as its zip spells it, without the version
 * ("Leatrix_Plus-1.60.37-forever.zip" -> "Leatrix Plus", "!BugGrabber-v12.1.1.zip"
 * -> "BugGrabber"), else the key in title case. `names` overrides both.
 */
export function addonName(id: string, entry: AddonSources[string], names: Record<string, string> = {}): string {
  const override = names[id];
  if (override !== undefined) return override;
  const file = entry.url?.split("/").pop();
  if (file !== undefined && file !== "") {
    let base: string;
    try {
      base = decodeURIComponent(file);
    } catch {
      base = file;
    }
    const name = base
      .replace(/\.zip$/i, "")
      .replace(/^!+/, "")
      .replace(/[-_ ]v?\d.*$/i, "")
      .replace(/_/g, " ")
      .trim();
    if (name !== "") return name;
  }
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const hostOf = (source: string): Addon["host"] => (source === "github" || source === "curseforge" ? source : "other");

/**
 * The add-ons in the content's groups, in the content's order. An add-on the
 * groups name but the list no longer has is dropped; one the list has but no
 * group names goes to "other", by name.
 */
export function groupAddons(sources: AddonSources, groups: readonly WowAddonGroup[], names: Record<string, string> = {}): AddonGroup[] {
  const toAddon = (id: string): Addon | undefined => {
    const entry = sources[id];
    if (entry === undefined) return undefined;
    const href = addonHref(entry);
    return { id, name: addonName(id, entry, names), ...(href !== undefined && { href }), host: hostOf(entry.source) };
  };
  const placed = new Set<string>();
  const out: AddonGroup[] = [];
  for (const group of groups) {
    const addons = group.addons.flatMap((id) => {
      const addon = toAddon(id);
      if (addon === undefined) return [];
      placed.add(id);
      return [addon];
    });
    if (addons.length > 0) out.push({ id: group.id, title: group.title, addons });
  }
  const rest = Object.keys(sources)
    .filter((id) => !placed.has(id))
    .flatMap((id) => toAddon(id) ?? [])
    .sort((a, b) => a.name.localeCompare(b.name));
  if (rest.length > 0) out.push({ id: "other", addons: rest });
  return out;
}
