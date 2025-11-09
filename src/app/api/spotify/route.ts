import { NextResponse } from "next/server";

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString("base64");

async function getAccessToken() {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token!,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get access token: ${text}`);
  }

  return response.json();
}

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
      return NextResponse.json({ isPlaying: false });
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Spotify API error: ${text}`);
    }

    const song = await response.json();
    return NextResponse.json(song);
  } catch (error) {
    console.error("Error in /api/spotify:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error fetching Spotify data",
      },
      { status: 500 }
    );
  }
}
