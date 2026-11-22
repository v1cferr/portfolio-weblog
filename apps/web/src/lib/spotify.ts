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

async function api(path: string, token: string): Promise<Response> {
  return fetch(`https://api.spotify.com/v1${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
}

/** What the owner is playing now, else the last track played, else "off". */
export async function getNowPlaying(now = new Date()): Promise<NowPlaying> {
  try {
    const token = await accessToken();
    if (token === undefined) return off(now);

    const current = await api("/me/player/currently-playing?additional_types=track", token);
    if (current.status === 200) {
      const playing = fromCurrentlyPlaying((await current.json()) as Parameters<typeof fromCurrentlyPlaying>[0], now);
      if (playing !== undefined) return playing;
    } else if (current.status !== 204) {
      warnOnce(`currently-playing answered ${String(current.status)}`);
    }

    const recent = await api("/me/player/recently-played?limit=1", token);
    if (!recent.ok) {
      warnOnce(`recently-played answered ${String(recent.status)}`);
      return off(now);
    }
    return fromRecentlyPlayed((await recent.json()) as Parameters<typeof fromRecentlyPlayed>[0], now);
  } catch (error) {
    warnOnce(error instanceof Error ? error.message : "unexpected error");
    return off(now);
  }
}
