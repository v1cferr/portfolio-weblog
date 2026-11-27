import { z } from "zod";

import { EditorialStatus, Id, LocalizedText, Media, Visibility } from "./common";
import { Day } from "./now";

/*
 * The World of Warcraft page (ADR 0015). Not entities: no relations, so the
 * file loads on its own, like the now log. Characters are mapped once with
 * `pnpm wow:sync` (the owner's own Battle.net login, on their machine) and
 * refreshed at runtime with the site's client credentials; whatever this file
 * says is what the page shows when Battle.net does not answer.
 */

/** Battle.net API regions. China runs its own service and is not supported. */
export const WowRegion = z.enum(["us", "eu", "kr", "tw"]);
export type WowRegion = z.infer<typeof WowRegion>;

/** WoW Forever has no realms: one mega-realm per ruleset and region. */
export const WowRuleset = z.enum(["normal", "pvp", "rp", "rp-pvp", "hardcore"]);
export type WowRuleset = z.infer<typeof WowRuleset>;

export const WowFaction = z.enum(["alliance", "horde", "neutral"]);
export type WowFaction = z.infer<typeof WowFaction>;

/** A character name as the game allows it: one word of letters (accents included), no spaces or digits. */
const CharacterName = z.string().regex(/^\p{L}{2,12}$/u, "a character name is one word of 2 to 12 letters");

const characterFields = {
  name: CharacterName,
  region: WowRegion,
  /** Class and race as the game names them in English ("Paladin", "Night Elf"); live data localizes them. */
  class: z.string().min(1).optional(),
  race: z.string().min(1).optional(),
  faction: WowFaction.optional(),
  level: z.int().min(1).max(100).optional(),
  /**
   * Ask Battle.net for this character at runtime. Off, the page shows only this
   * file. WoW Forever's profile route is undocumented, so a character that keeps
   * failing can be switched off here without touching code.
   */
  live: z.boolean().default(true),
  /** The character the owner plays most, listed first. */
  main: z.boolean().default(false),
  armoryUrl: z.url({ protocol: /^https$/ }).optional(),
  note: LocalizedText.optional(),
  visibility: Visibility.default("public"),
};

export const RetailCharacter = z.strictObject({
  game: z.literal("retail"),
  ...characterFields,
  /** The realm's display name ("Stormrage"). */
  realm: z.string().min(1),
  /** Battle.net's slug for the realm ("stormrage"); derived from the name when absent. */
  realmSlug: Id.optional(),
});
export type RetailCharacter = z.infer<typeof RetailCharacter>;

export const ForeverCharacter = z.strictObject({
  game: z.literal("forever"),
  ...characterFields,
  /** Forever characters are "Name Surname". */
  surname: CharacterName,
  ruleset: WowRuleset.optional(),
});
export type ForeverCharacter = z.infer<typeof ForeverCharacter>;

export const WowCharacter = z.discriminatedUnion("game", [ForeverCharacter, RetailCharacter]);
export type WowCharacter = z.infer<typeof WowCharacter>;

/** A mount the owner is after, linked on Wowhead by its item id (no hotlinked images). */
export const WowWish = z.strictObject({
  wowheadItem: z.int().positive(),
  name: LocalizedText,
  note: LocalizedText.optional(),
});
export type WowWish = z.infer<typeof WowWish>;

export const WowAddonGroup = z.strictObject({
  id: Id,
  title: LocalizedText,
  /** Keys of the add-on list (`sources.json` in the dotfiles). */
  addons: z.array(z.string().min(1)).min(1),
});
export type WowAddonGroup = z.infer<typeof WowAddonGroup>;

export const WowAddons = z.strictObject({
  /** The add-on list, read at runtime (raw JSON: name -> source, project id or repo, version, url, hash). */
  sources: z.url({ protocol: /^https$/ }),
  /** Where the Nix derivation that installs them lives. */
  package: z.url({ protocol: /^https$/ }),
  /** Display groups; an add-on in none of them is listed under "Other". */
  groups: z.array(WowAddonGroup).default([]),
  /** Display names where the one read from the file name is not right. */
  names: z.record(z.string().min(1), z.string().min(1)).default({}),
});
export type WowAddons = z.infer<typeof WowAddons>;

/** A stable key for a character: one per game, region, realm or surname, and name. */
export function wowCharacterKey(character: WowCharacter): string {
  const place = character.game === "retail" ? (character.realmSlug ?? slugifyRealm(character.realm)) : character.surname.toLowerCase();
  return `${character.game}:${character.region}:${place}:${character.name.toLowerCase()}`;
}

/** Battle.net realm slugs: lowercase, accents and apostrophes dropped, spaces to dashes ("Aman'Thul" -> "amanthul"). */
export function slugifyRealm(realm: string): string {
  return realm
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Wow = z
  .strictObject({
    status: EditorialStatus.default("published"),
    visibility: Visibility.default("public"),
    /** The day `pnpm wow:sync` last mapped the characters; absent until it runs. */
    syncedAt: Day.optional(),
    /**
     * Characters below this level stay in the file (the sync keeps them) but
     * are not shown, whatever the game. A character with no known level is
     * hidden too while it is set.
     */
    minLevel: z.int().min(1).max(100).optional(),
    characters: z.array(WowCharacter).default([]),
    wishlist: z.array(WowWish).default([]),
    addons: WowAddons.optional(),
    /**
     * In-game screenshots, prepared with `pnpm media:add` (no metadata). The
     * page shows a gallery only when there is at least one.
     */
    screenshots: z.array(Media).default([]),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.characters.forEach((character, index) => {
      const key = wowCharacterKey(character);
      if (seen.has(key)) ctx.addIssue({ code: "custom", path: ["characters", index], message: `duplicate character ${key}` });
      seen.add(key);
    });
    const grouped = new Set<string>();
    value.addons?.groups.forEach((group, groupIndex) => {
      group.addons.forEach((addon, index) => {
        if (grouped.has(addon)) {
          ctx.addIssue({ code: "custom", path: ["addons", "groups", groupIndex, "addons", index], message: `"${addon}" is in two groups` });
        }
        grouped.add(addon);
      });
    });
  });
export type Wow = z.infer<typeof Wow>;
