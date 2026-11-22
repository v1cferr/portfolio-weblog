import { getNowPlaying } from "@/lib/spotify";

/**
 * The owner's Spotify "now playing", in the small shape of lib/now-playing.ts.
 * The CDN answers every visitor from one upstream call per 20 s, which keeps
 * the per-developer Spotify quota safe however many people are on the page.
 */
export async function GET() {
  return Response.json(await getNowPlaying(), {
    headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=40" },
  });
}
