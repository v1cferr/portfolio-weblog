import type { LocalizedText, WowFaction, WowRegion } from "@workspace/content";
import { z } from "zod";

/*
 * A small Battle.net client for public World of Warcraft profiles, with the
 * site's own client credentials: no user login at runtime (v1 needed one and
 * broke when its token expired; ADR 0015). Pure and fetch-injected, so it is
 * unit-tested; lib/blizzard.ts wires it to the environment and Next's cache.
 * Nothing here throws: every failure is a reason the page can fall back on.
 */

export const TOKEN_URL = "https://oauth.battle.net/token";
export const RENDER_HOST = "render.worldofwarcraft.com";

export type BattleNetFailure = "no-credentials" | "unauthorized" | "forbidden" | "not-found" | "timeout" | "error";
export type BattleNetResult<T> = { ok: true; data: T } | { ok: false; reason: BattleNetFailure; status?: number };

export interface BattleNetOptions {
  clientId?: string | undefined;
  clientSecret?: string | undefined;
  /** Injected for tests. */
  fetch?: typeof fetch;
  /** Merged into every API request (not the token one), e.g. `{ next: { revalidate, tags } }`. */
  init?: RequestInit & Record<string, unknown>;
  timeoutMs?: number;
  /** Clock, for the token's expiry; injected for tests. */
  now?: () => number;
}

/** The API host of a region. */
export const apiHost = (region: WowRegion) => `https://${region}.api.blizzard.com`;

/**
 * The realmless profile slug of a WoW Forever character, "name-surname" in
 * lowercase. Undocumented: found by the community in November 2026
 * (us.forums.blizzard.com/en/blizzard/t/60334), so callers gate it.
 */
export function foreverSlug(name: string, surname: string): string {
  return encodeURIComponent(`${name}-${surname}`.toLocaleLowerCase("en-US"));
}

/** Profile paths, without the namespace. */
export const characterPath = {
  retail: (realmSlug: string, name: string) =>
    `/profile/wow/character/${encodeURIComponent(realmSlug)}/${encodeURIComponent(name.toLocaleLowerCase("en-US"))}`,
  forever: (name: string, surname: string) => `/profile/wow/character/${foreverSlug(name, surname)}`,
};

/** The profile namespace of a game in a region. */
export const profileNamespace = (game: "retail" | "forever", region: WowRegion) =>
  game === "retail" ? `profile-${region}` : `profile-forever-${region}`;

const failureOf = (status: number): BattleNetFailure =>
  status === 401 ? "unauthorized" : status === 403 ? "forbidden" : status === 404 ? "not-found" : "error";

const isTimeout = (error: unknown) => error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");

export function createBattleNetClient(options: BattleNetOptions) {
  const { clientId, clientSecret, init = {}, timeoutMs = 5000 } = options;
  const doFetch = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  let cached: { token: string; expiresAt: number } | undefined;
  let pending: Promise<BattleNetResult<string>> | undefined;

  async function requestToken(): Promise<BattleNetResult<string>> {
    if (clientId === undefined || clientId === "" || clientSecret === undefined || clientSecret === "") {
      return { ok: false, reason: "no-credentials" };
    }
    try {
      const response = await doFetch(TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) return { ok: false, reason: failureOf(response.status), status: response.status };
      const body = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
      if (typeof body.access_token !== "string" || typeof body.expires_in !== "number") return { ok: false, reason: "error" };
      cached = { token: body.access_token, expiresAt: now() + body.expires_in * 1000 };
      return { ok: true, data: body.access_token };
    } catch (error) {
      return { ok: false, reason: isTimeout(error) ? "timeout" : "error" };
    }
  }

  /** A client-credentials token, reused until a minute before it expires (they last a day). */
  async function token(): Promise<BattleNetResult<string>> {
    if (cached !== undefined && cached.expiresAt > now() + 60_000) return { ok: true, data: cached.token };
    // Concurrent callers share one request.
    pending ??= requestToken().finally(() => {
      pending = undefined;
    });
    return pending;
  }

  async function get(region: WowRegion, path: string, namespace: string): Promise<BattleNetResult<unknown>> {
    const auth = await token();
    if (!auth.ok) return auth;
    const url = new URL(path, apiHost(region));
    url.searchParams.set("namespace", namespace);
    try {
      const response = await doFetch(url, {
        ...init,
        headers: { Authorization: `Bearer ${auth.data}` },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        // A revoked or expired token: drop it so the next call asks for a new one.
        if (response.status === 401) cached = undefined;
        return { ok: false, reason: failureOf(response.status), status: response.status };
      }
      return { ok: true, data: (await response.json()) as unknown };
    } catch (error) {
      return { ok: false, reason: isTimeout(error) ? "timeout" : "error" };
    }
  }

  return {
    token,
    /** The profile summary and the render of one character, mapped to what the page shows. */
    async character(
      ref:
        | { game: "retail"; region: WowRegion; realmSlug: string; name: string }
        | { game: "forever"; region: WowRegion; name: string; surname: string }
    ): Promise<BattleNetResult<LiveCharacter>> {
      const path = ref.game === "retail" ? characterPath.retail(ref.realmSlug, ref.name) : characterPath.forever(ref.name, ref.surname);
      const namespace = profileNamespace(ref.game, ref.region);
      const [profile, media] = await Promise.all([get(ref.region, path, namespace), get(ref.region, `${path}/character-media`, namespace)]);
      if (!profile.ok) return profile;
      const live = mapProfile(profile.data);
      // A missing render (Forever renders can take hours to appear) never fails the character.
      const renderUrl = media.ok ? pickRender(media.data) : undefined;
      return { ok: true, data: renderUrl === undefined ? live : { ...live, renderUrl } };
    },
  };
}

export type BattleNetClient = ReturnType<typeof createBattleNetClient>;

/* ---------- Mapping ---------- */

/** What the page takes from a live profile. Names are localized when Battle.net sends every locale. */
export interface LiveCharacter {
  level?: number;
  className?: LocalizedText;
  raceName?: LocalizedText;
  faction?: WowFaction;
  /** Retail: the realm; Forever: the ruleset. */
  placeName?: LocalizedText;
  itemLevel?: number;
  achievementPoints?: number;
  /** ISO time of the last logout. */
  lastLogin?: string;
  renderUrl?: string;
}

/** Without a `locale` parameter, Battle.net returns every name as { en_US, pt_BR, zh_CN, ... }. */
const BLIZZARD_LOCALES = { en_US: "en-us", pt_BR: "pt-br", zh_CN: "zh-cn" } as const;

const Named = z.object({ name: z.union([z.string(), z.record(z.string(), z.string())]) });

function localized(value: unknown): LocalizedText | undefined {
  const parsed = Named.safeParse(value);
  if (!parsed.success) return undefined;
  const { name } = parsed.data;
  if (typeof name === "string") return name === "" ? undefined : { "en-us": name };
  const out: Record<string, string> = {};
  for (const [blizzard, locale] of Object.entries(BLIZZARD_LOCALES)) {
    const text = name[blizzard];
    if (text !== undefined && text !== "") out[locale] = text;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const Profile = z.object({
  level: z.number().int().optional(),
  character_class: z.unknown().optional(),
  race: z.unknown().optional(),
  faction: z.object({ type: z.string() }).optional(),
  realm: z.unknown().optional(),
  ruleset: z.unknown().optional(),
  equipped_item_level: z.number().optional(),
  achievement_points: z.number().optional(),
  last_login_timestamp: z.number().optional(),
});

const FACTIONS: Record<string, WowFaction> = { ALLIANCE: "alliance", HORDE: "horde", NEUTRAL: "neutral" };

/** Maps a character profile summary; unknown or malformed fields are left out. */
export function mapProfile(data: unknown): LiveCharacter {
  const parsed = Profile.safeParse(data);
  if (!parsed.success) return {};
  const p = parsed.data;
  const out: LiveCharacter = {};
  if (p.level !== undefined) out.level = p.level;
  const className = localized(p.character_class);
  if (className !== undefined) out.className = className;
  const raceName = localized(p.race);
  if (raceName !== undefined) out.raceName = raceName;
  const faction = p.faction === undefined ? undefined : FACTIONS[p.faction.type];
  if (faction !== undefined) out.faction = faction;
  const placeName = localized(p.realm) ?? localized(p.ruleset);
  if (placeName !== undefined) out.placeName = placeName;
  if (p.equipped_item_level !== undefined) out.itemLevel = p.equipped_item_level;
  if (p.achievement_points !== undefined) out.achievementPoints = p.achievement_points;
  if (p.last_login_timestamp !== undefined) out.lastLogin = new Date(p.last_login_timestamp).toISOString();
  return out;
}

const Media = z.object({ assets: z.array(z.object({ key: z.string(), value: z.string() })) });

/** Render keys in order of preference: a square portrait first, it fits the card. */
const RENDER_KEYS = ["avatar", "inset", "main-raw", "main"];

/** The character's render, only from Blizzard's render host over https (the CSP allows no other). */
export function pickRender(data: unknown): string | undefined {
  const parsed = Media.safeParse(data);
  if (!parsed.success) return undefined;
  for (const key of RENDER_KEYS) {
    const value = parsed.data.assets.find((asset) => asset.key === key)?.value;
    if (value === undefined) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "https:" && url.hostname === RENDER_HOST) return url.toString();
    } catch {
      // Not a URL: try the next key.
    }
  }
  return undefined;
}
