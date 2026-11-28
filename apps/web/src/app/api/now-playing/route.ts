import { getNowPlaying, nowPlayingMaxAge } from "@/lib/spotify";

/**
 * The owner's Spotify "now playing", in the small shape of lib/now-playing.ts.
 * The CDN answers every visitor from one upstream call per 20 s, which keeps
 * the per-developer Spotify quota safe however many people are on the page.
 * While Spotify asks to wait (429), the CDN keeps the answer longer.
 */
export async function GET() {
  const nowPlaying = await getNowPlaying();
  return Response.json(nowPlaying, {
    headers: { "Cache-Control": `public, s-maxage=${String(nowPlayingMaxAge())}, stale-while-revalidate=40` },
  });
}
