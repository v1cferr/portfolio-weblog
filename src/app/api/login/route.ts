import { stringify } from "querystring";

import { NextResponse } from "next/server";

// Generates the random string used for the state parameter
function generateRandomString(length: number): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const client_id: string | undefined = process.env.SPOTIFY_CLIENT_ID;
const redirect_uri: string | undefined = process.env.SPOTIFY_REDIRECT_URI;

/**
 *
 */
export async function GET() {
  const state = generateRandomString(16);
  const scope = "user-read-private user-read-email user-read-currently-playing";

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
    });

  return NextResponse.redirect(authUrl);
}
