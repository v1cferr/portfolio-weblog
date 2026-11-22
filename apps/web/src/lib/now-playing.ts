/**
 * The "now playing" payload the site exposes: a small, fixed shape mapped
 * from Spotify's responses, so nothing else from the account ever reaches the
 * browser. Pure, so it is unit-tested apart from the network (see spotify.ts).
 */
export type NowPlayingState = "playing" | "paused" | "recent" | "off";

export interface NowPlaying {
  state: NowPlayingState;
  title?: string;
  artists?: string[];
  album?: string;
  /** The track's page on open.spotify.com. */
  trackUrl?: string;
  /** Spotify's image hash (i.scdn.co/image/{coverId}); the cover route dithers it. */
  coverId?: string;
  progressMs?: number;
  durationMs?: number;
  /** When a "recent" track was played (ISO 8601). */
  playedAt?: string;
  /** When this snapshot was taken, so the client can advance the progress bar. */
  fetchedAt: string;
}

/** Spotify image hashes are 40 hex characters; anything else is refused. */
export const COVER_ID = /^[0-9a-f]{40}$/;

interface SpotifyTrack {
  type?: string;
  name?: string;
  duration_ms?: number;
  artists?: { name?: string }[];
  album?: { name?: string; images?: { url?: string; width?: number | null }[] };
  external_urls?: { spotify?: string };
}

/** The cover's hash from the largest image URL, when it is a plain i.scdn.co link. */
export function coverIdOf(track: SpotifyTrack): string | undefined {
  const images = [...(track.album?.images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const match = /^https:\/\/i\.scdn\.co\/image\/([0-9a-f]{40})$/.exec(images[0]?.url ?? "");
  return match?.[1];
}

function trackFields(track: SpotifyTrack) {
  const trackUrl = track.external_urls?.spotify;
  const coverId = coverIdOf(track);
  return {
    ...(track.name !== undefined && { title: track.name }),
    artists: (track.artists ?? []).flatMap((artist) => (artist.name === undefined ? [] : [artist.name])),
    ...(track.album?.name !== undefined && { album: track.album.name }),
    ...(trackUrl?.startsWith("https://open.spotify.com/") === true && { trackUrl }),
    ...(coverId !== undefined && { coverId }),
    ...(track.duration_ms !== undefined && { durationMs: track.duration_ms }),
  };
}

/** From GET /v1/me/player/currently-playing; undefined when there is no track to show. */
export function fromCurrentlyPlaying(
  body: { is_playing?: boolean; progress_ms?: number | null; currently_playing_type?: string; item?: SpotifyTrack | null },
  now: Date
): NowPlaying | undefined {
  const item = body.item;
  if (item === null || item === undefined || body.currently_playing_type !== "track" || item.type !== "track") return undefined;
  return {
    state: body.is_playing === true ? "playing" : "paused",
    ...trackFields(item),
    ...(typeof body.progress_ms === "number" && { progressMs: body.progress_ms }),
    fetchedAt: now.toISOString(),
  };
}

/** From GET /v1/me/player/recently-played?limit=1. */
export function fromRecentlyPlayed(body: { items?: { track?: SpotifyTrack; played_at?: string }[] }, now: Date): NowPlaying {
  const last = body.items?.[0];
  if (last?.track === undefined) return off(now);
  return {
    state: "recent",
    ...trackFields(last.track),
    ...(last.played_at !== undefined && { playedAt: last.played_at }),
    fetchedAt: now.toISOString(),
  };
}

export function off(now: Date): NowPlaying {
  return { state: "off", fetchedAt: now.toISOString() };
}
