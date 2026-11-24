import { slugifyRealm, WowCharacter, wowCharacterKey, type WowRegion, type WowRuleset } from "@workspace/content";

/*
 * The mapping half of `pnpm wow:sync` (scripts/wow-sync.ts), kept pure so it is
 * unit-tested: turn the account summary Battle.net returns for the owner's own
 * login (/profile/user/wow) into content/games/wow.yaml characters, and merge
 * them with what the file already says without touching the fields the owner
 * edits by hand.
 */

/** Level caps: a character at the cap is worth asking Battle.net about every day. */
export const MAX_LEVEL = { retail: 90, forever: 60 } as const;

/** Fields the sync owns; everything else in a character (live, main, note, visibility, armoryUrl) is the owner's. */
const SYNCED_FIELDS = ["class", "race", "faction", "level", "realm", "realmSlug", "ruleset"] as const;

type Raw = Record<string, unknown>;

const text = (value: unknown): string | undefined => {
  if (typeof value === "string" && value !== "") return value;
  if (typeof value === "object" && value !== null) {
    const named = value as { name?: unknown; en_US?: unknown };
    if (named.name !== undefined) return text(named.name);
    if (typeof named.en_US === "string") return named.en_US;
  }
  return undefined;
};

/** WoW Forever ruleset names as the API may spell them, to the content's ids. */
export function rulesetOf(value: unknown): WowRuleset | undefined {
  const name = text(value)
    ?.toLowerCase()
    .replace(/roleplaying|role-playing|role playing/g, "rp")
    .replace(/player versus player|player vs\.? player/g, "pvp")
    .replace(/[\s_]+/g, "-");
  switch (name) {
    case "normal":
    case "pve":
      return "normal";
    case "pvp":
      return "pvp";
    case "rp":
      return "rp";
    case "rp-pvp":
    case "rppvp":
      return "rp-pvp";
    case "hardcore":
      return "hardcore";
    default:
      return undefined;
  }
}

const FACTIONS: Record<string, "alliance" | "horde" | "neutral"> = { ALLIANCE: "alliance", HORDE: "horde", NEUTRAL: "neutral" };

/** One character of the account summary, as a content entry; undefined when it lacks what the schema needs. */
export function mapAccountCharacter(game: "retail" | "forever", region: WowRegion, raw: unknown): Raw | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const c = raw as Raw;
  const name = text(c.name);
  if (name === undefined) return undefined;
  const level = typeof c.level === "number" ? c.level : undefined;
  const faction = FACTIONS[(c.faction as { type?: string } | undefined)?.type ?? ""];
  const base: Raw = {
    game,
    name,
    region,
    ...(text(c.playable_class) !== undefined && { class: text(c.playable_class) }),
    ...(text(c.playable_race) !== undefined && { race: text(c.playable_race) }),
    ...(faction !== undefined && { faction }),
    ...(level !== undefined && { level }),
  };
  let entry: Raw;
  if (game === "retail") {
    const realm = text(c.realm);
    if (realm === undefined) return undefined;
    const slug = (c.realm as { slug?: unknown }).slug;
    const realmSlug = typeof slug === "string" && slug !== "" ? slug : slugifyRealm(realm);
    entry = {
      ...base,
      realm,
      ...(realmSlug !== slugifyRealm(realm) && { realmSlug }),
      armoryUrl: `https://worldofwarcraft.blizzard.com/en-us/character/${region}/${realmSlug}/${encodeURIComponent(name.toLowerCase())}`,
    };
  } else {
    const surname = text(c.surname);
    if (surname === undefined) return undefined;
    const ruleset = rulesetOf(c.ruleset);
    entry = { ...base, surname, ...(ruleset !== undefined && { ruleset }) };
  }
  // Only what the schema accepts gets into the file.
  return WowCharacter.safeParse(entry).success ? entry : undefined;
}

/** Every character of an account summary ({ wow_accounts: [{ characters }] }). */
export function mapAccountSummary(game: "retail" | "forever", region: WowRegion, summary: unknown): { characters: Raw[]; skipped: number } {
  const accounts = (summary as { wow_accounts?: { characters?: unknown[] }[] } | undefined)?.wow_accounts ?? [];
  const all = accounts.flatMap((account) => account.characters ?? []);
  const characters = all.flatMap((raw): Raw[] => {
    const character = mapAccountCharacter(game, region, raw);
    return character === undefined ? [] : [character];
  });
  return { characters, skipped: all.length - characters.length };
}

const keyOf = (raw: Raw): string | undefined => {
  const parsed = WowCharacter.safeParse(raw);
  return parsed.success ? wowCharacterKey(parsed.data) : undefined;
};

const label = (raw: Raw) =>
  [raw.name, raw.surname].filter((part) => typeof part === "string").join(" ") +
  ` (${String(raw.game)}, ${String(raw.region).toUpperCase()})`;

export interface MergeResult {
  characters: Raw[];
  added: string[];
  updated: string[];
  /** Characters the file has that Battle.net no longer listed; kept, for the owner to decide. */
  missing: string[];
}

/**
 * Merges what Battle.net found into the file's characters. Known characters
 * get the synced fields refreshed and keep the owner's; new ones are appended
 * with `live` on only at the level cap; characters Battle.net did not list
 * stay as they are. Only regions and games that were actually read count as
 * "missing".
 */
export function mergeCharacters(existing: readonly Raw[], found: readonly Raw[], read: ReadonlySet<string>): MergeResult {
  const foundByKey = new Map<string, Raw>();
  for (const raw of found) {
    const key = keyOf(raw);
    if (key !== undefined) foundByKey.set(key, raw);
  }
  const seen = new Set<string>();
  const result: MergeResult = { characters: [], added: [], updated: [], missing: [] };

  for (const current of existing) {
    const key = keyOf(current);
    const fresh = key === undefined ? undefined : foundByKey.get(key);
    if (key === undefined || fresh === undefined) {
      result.characters.push(current);
      if (read.has(`${String(current.game)}:${String(current.region)}`)) result.missing.push(label(current));
      continue;
    }
    seen.add(key);
    const next: Raw = { ...current };
    for (const field of SYNCED_FIELDS) {
      if (fresh[field] !== undefined) next[field] = fresh[field];
    }
    if (next.armoryUrl === undefined && fresh.armoryUrl !== undefined) next.armoryUrl = fresh.armoryUrl;
    if (JSON.stringify(next) !== JSON.stringify(current)) result.updated.push(label(next));
    result.characters.push(next);
  }

  for (const [key, fresh] of foundByKey) {
    if (seen.has(key)) continue;
    const cap = MAX_LEVEL[fresh.game === "forever" ? "forever" : "retail"];
    result.characters.push({ ...fresh, live: typeof fresh.level === "number" && fresh.level >= cap });
    result.added.push(label(fresh));
  }
  return result;
}
