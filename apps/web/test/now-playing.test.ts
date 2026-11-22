import { describe, expect, it } from "vitest";

import { COVER_ID, coverIdOf, fromCurrentlyPlaying, fromRecentlyPlayed, off } from "../src/lib/now-playing";

const now = new Date("2026-11-22T12:00:00Z");
const hash = "ab67616d0000b273" + "0".repeat(24);
const track = {
  type: "track",
  name: "505",
  duration_ms: 253_000,
  artists: [{ name: "Arctic Monkeys" }],
  album: {
    name: "Favourite Worst Nightmare",
    images: [
      { url: `https://i.scdn.co/image/${"1".repeat(40)}`, width: 64 },
      { url: `https://i.scdn.co/image/${hash}`, width: 640 },
    ],
  },
  external_urls: { spotify: "https://open.spotify.com/track/58ge6dfP91o9oXMzq3XkIS" },
};

describe("now playing", () => {
  it("maps a playing track to the small public shape", () => {
    expect(fromCurrentlyPlaying({ is_playing: true, progress_ms: 134_000, currently_playing_type: "track", item: track }, now)).toEqual({
      state: "playing",
      title: "505",
      artists: ["Arctic Monkeys"],
      album: "Favourite Worst Nightmare",
      trackUrl: "https://open.spotify.com/track/58ge6dfP91o9oXMzq3XkIS",
      coverId: hash,
      durationMs: 253_000,
      progressMs: 134_000,
      fetchedAt: now.toISOString(),
    });
  });

  it("marks a paused track and skips podcasts", () => {
    expect(fromCurrentlyPlaying({ is_playing: false, currently_playing_type: "track", item: track }, now)?.state).toBe("paused");
    expect(
      fromCurrentlyPlaying({ is_playing: true, currently_playing_type: "episode", item: { ...track, type: "episode" } }, now)
    ).toBeUndefined();
    expect(fromCurrentlyPlaying({ is_playing: true, currently_playing_type: "track", item: null }, now)).toBeUndefined();
  });

  it("falls back to the last track played, or off", () => {
    const recent = fromRecentlyPlayed({ items: [{ track, played_at: "2026-11-22T10:00:00Z" }] }, now);
    expect(recent).toMatchObject({ state: "recent", title: "505", playedAt: "2026-11-22T10:00:00Z" });
    expect(fromRecentlyPlayed({ items: [] }, now)).toEqual(off(now));
  });

  it("only trusts plain i.scdn.co hashes and open.spotify.com links", () => {
    expect(coverIdOf({ album: { images: [{ url: "https://evil.example/image/" + hash }] } })).toBeUndefined();
    expect(COVER_ID.test(hash)).toBe(true);
    expect(COVER_ID.test("../../etc/passwd")).toBe(false);
    expect(COVER_ID.test(hash + "0")).toBe(false);
    const mapped = fromCurrentlyPlaying(
      { is_playing: true, currently_playing_type: "track", item: { ...track, external_urls: { spotify: "javascript:alert(1)" } } },
      now
    );
    expect(mapped?.trackUrl).toBeUndefined();
  });
});
