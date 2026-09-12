import { NextResponse } from "next/server";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

/**
 * Raised when Spotify refuses the stored credentials, either because they are
 * missing or because the refresh token was revoked. Retrying cannot recover
 * from it: the token has to be generated again through /api/login.
 */
class SpotifyCredentialsError extends Error {}

/**
 * Payload used whenever there is nothing to show, so the player falls back to
 * its idle state instead of rendering an error to visitors.
 */
const notPlaying = () => NextResponse.json({ is_playing: false });

/**
 * Exchanges the stored refresh token for a short-lived access token.
 */
async function getAccessToken() {
  if (!client_id || !client_secret || !refresh_token) {
    throw new SpotifyCredentialsError("Spotify environment variables are not configured");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();

    if (text.includes("invalid_grant")) {
      throw new SpotifyCredentialsError(`Refresh token rejected by Spotify: ${text}`);
    }

    throw new Error(`Failed to get access token: ${text}`);
  }

  return response.json();
}

/**
 *
 */
export async function GET() {
  try {
    const { access_token } = await getAccessToken();

    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (response.status === 204) {
      return notPlaying();
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Spotify API error: ${text}`);
    }

    const song = await response.json();
    return NextResponse.json(song);
  } catch (error) {
    // A broken integration is not worth an error state on the page: log it for
    // the maintainer and let the player render as if nothing were playing.
    if (error instanceof SpotifyCredentialsError) {
      console.warn("Spotify integration unavailable:", error.message);
      return notPlaying();
    }

    console.error("Error in /api/spotify:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error fetching Spotify data",
      },
      { status: 500 }
    );
  }
}
