import "server-only";

import { fromCurrentlyPlaying, fromRecentlyPlayed, type NowPlaying, off } from "./now-playing";

/*
 * Spotify's Web API for the owner's own account, from the server only. The
 * credentials (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN)
 * never reach the browser; `pnpm spotify:token` issues the refresh token once,
 * with the scopes user-read-currently-playing and user-read-recently-played.
 * Since 2026-03-09 Development Mode apps need the owner on Spotify Premium.
 * Anything that goes wrong becomes "off": visitors never see an error.
 */

let cached: { token: string; expiresAt: number } | undefined;
let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`Spotify now playing unavailable: ${message}`);
}

async function accessToken(): Promise<string | undefined> {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env;
  if (id === undefined || id === "" || secret === undefined || secret === "" || refresh === undefined || refresh === "") {
    warnOnce("credentials are not configured");
    return undefined;
  }
  if (cached !== undefined && cached.expiresAt > Date.now() + 30_000) return cached.token;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
    cache: "no-store",
  });
  if (!response.ok) {
    // invalid_grant: the token was revoked or belongs to another client; run pnpm spotify:token again.
    warnOnce(`token exchange failed with ${String(response.status)}`);
    return undefined;
  }
  const { access_token: token, expires_in: expiresIn } = (await response.json()) as { access_token: string; expires_in: number };
  cached = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

const CURRENT = "/me/player/currently-playing";
const RECENT = "/me/player/recently-played";
/** The last track played changes only when nothing is playing, so it is asked for at most this often. */
const RECENT_TTL_MS = 5 * 60_000;
/** When a 429 carries no usable Retry-After. */
const DEFAULT_WAIT_MS = 60_000;
/** The CDN's usual refresh, and the longest it keeps an answer while Spotify asks to wait. */
const MAX_AGE = 20;
const MAX_WAIT_AGE = 3600;

type RecentBody = Parameters<typeof fromRecentlyPlayed>[0];

/*
 * Spotify answers 429 with a Retry-After that can be hours (2026-11-28: 8798 s
 * on recently-played). Calling again before it ends only keeps the block, so
 * each endpoint is left alone until then, and the last track played is kept
 * and reused instead of asked for every time.
 */
const blockedUntil = new Map<string, number>();
let recent: { body: RecentBody; fetchedAt: number } | undefined;

/** Milliseconds Spotify asked to wait, from the Retry-After header in seconds. */
export function retryAfterMs(header: string | null): number {
  const seconds = Number(header);
  return header !== null && Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_WAIT_MS;
}

/** The endpoint's answer, or undefined while Spotify asked not to call it. */
async function api(path: string, query: string, token: string, now: number): Promise<Response | undefined> {
  if ((blockedUntil.get(path) ?? 0) > now) return undefined;
  const response = await fetch(`https://api.spotify.com/v1${path}${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (response.status === 429) {
    const wait = retryAfterMs(response.headers.get("retry-after"));
    blockedUntil.set(path, now + wait);
    warnOnce(`${path} answered 429, waiting ${String(Math.round(wait / 1000))} s`);
  }
  return response;
}

/**
 * Seconds the CDN may keep the answer: the usual 20, or until Spotify lets
 * "currently playing" be asked again, at most an hour. A block on the last
 * track played alone does not count: "now playing" still updates.
 */
export function nowPlayingMaxAge(now = Date.now()): number {
  const wait = Math.ceil(((blockedUntil.get(CURRENT) ?? 0) - now) / 1000);
  return Math.min(Math.max(MAX_AGE, wait), MAX_WAIT_AGE);
}

/** What the owner is playing now, else the last track played, else "off". */
export async function getNowPlaying(now = new Date()): Promise<NowPlaying> {
  const time = now.getTime();
  try {
    const token = await accessToken();
    if (token === undefined) return off(now);

    const current = await api(CURRENT, "?additional_types=track", token, time);
    if (current?.status === 200) {
      const playing = fromCurrentlyPlaying((await current.json()) as Parameters<typeof fromCurrentlyPlaying>[0], now);
      if (playing !== undefined) return playing;
    } else if (current !== undefined && current.status !== 204 && current.status !== 429) {
      warnOnce(`currently-playing answered ${String(current.status)}`);
    }

    if (recent !== undefined && time - recent.fetchedAt < RECENT_TTL_MS) return fromRecentlyPlayed(recent.body, now);
    const response = await api(RECENT, "?limit=1", token, time);
    if (response?.ok === true) {
      recent = { body: (await response.json()) as RecentBody, fetchedAt: time };
      return fromRecentlyPlayed(recent.body, now);
    }
    if (response !== undefined && response.status !== 429) warnOnce(`recently-played answered ${String(response.status)}`);
    // Blocked or failing: the last track already known is still the last one played.
    return recent === undefined ? off(now) : fromRecentlyPlayed(recent.body, now);
  } catch (error) {
    warnOnce(error instanceof Error ? error.message : "unexpected error");
    return off(now);
  }
}
