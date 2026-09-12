import { NextResponse } from "next/server";

/**
 *
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  // Spotify requires this to match the redirect_uri sent by /api/login byte for
  // byte, so both routes have to read it from the same environment variable.
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!redirectUri) {
    return NextResponse.json({ error: "SPOTIFY_REDIRECT_URI is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to get tokens" }, { status: 500 });
  }
}
