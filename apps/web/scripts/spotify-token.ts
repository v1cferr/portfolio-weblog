/**
 * Issues the Spotify refresh token for "now playing", once, on your machine:
 *
 *   SPOTIFY_CLIENT_ID=… SPOTIFY_CLIENT_SECRET=… pnpm --filter web spotify:token
 *
 * It listens on the redirect URI registered for the app
 * (http://127.0.0.1:3000/api/auth/callback; Spotify refuses "localhost"),
 * prints the authorization link, and after you approve it prints the refresh
 * token. Nothing is written to disk. Copy the token into Vercel as
 * SPOTIFY_REFRESH_TOKEN (Preview and Production). The token belongs to this
 * client id: issuing it with another app, or removing the app's access at
 * spotify.com/account/apps, revokes it.
 */
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";

const PORT = 3000;
const REDIRECT_URI = `http://127.0.0.1:${String(PORT)}/api/auth/callback`;
const SCOPES = "user-read-currently-playing user-read-recently-played";

const id = process.env.SPOTIFY_CLIENT_ID;
const secret = process.env.SPOTIFY_CLIENT_SECRET;
if (id === undefined || id === "" || secret === undefined || secret === "") {
  console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (from developer.spotify.com/dashboard) first.");
  process.exit(1);
}

const state = randomBytes(16).toString("hex");
const authorize = new URL("https://accounts.spotify.com/authorize");
authorize.search = new URLSearchParams({
  response_type: "code",
  client_id: id,
  scope: SCOPES,
  redirect_uri: REDIRECT_URI,
  state,
}).toString();

const server = createServer((request, response) => {
  void (async () => {
    const url = new URL(request.url ?? "/", REDIRECT_URI);
    if (url.pathname !== "/api/auth/callback") {
      response.writeHead(404).end();
      return;
    }
    const code = url.searchParams.get("code");
    if (url.searchParams.get("state") !== state || code === null) {
      response.writeHead(400).end("State mismatch or missing code; run the script again.");
      return;
    }
    const token = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
    });
    const body = (await token.json()) as { refresh_token?: string; scope?: string; error?: string };
    if (!token.ok || body.refresh_token === undefined) {
      response.writeHead(500).end("Spotify refused the code; see the terminal.");
      console.error("Token exchange failed:", body.error ?? token.status);
    } else {
      response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("Done. You can close this tab.");
      console.warn(`\nScopes: ${body.scope ?? ""}\nSPOTIFY_REFRESH_TOKEN=${body.refresh_token}\n`);
    }
    server.close();
  })();
});

server.listen(PORT, "127.0.0.1", () => {
  console.warn(`Open this link, approve, and come back:\n\n${authorize.toString()}\n`);
});
