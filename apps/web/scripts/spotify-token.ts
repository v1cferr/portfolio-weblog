/**
 * Issues the Spotify refresh token for "now playing", once, on your machine:
 *
 *   pnpm --filter web spotify:token --vercel
 *
 * With --vercel it reads SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET from the
 * linked Vercel project (development environment, through a temporary file
 * that is deleted at once) and, after you approve, stores the new refresh
 * token in production and preview (as a secret) and development, replacing
 * the old one. The token never leaves your machine except to Vercel. Without
 * --vercel, pass the two values in the environment and the token is printed.
 *
 * It listens on the redirect URI registered for the app
 * (http://127.0.0.1:3000/api/auth/callback; Spotify refuses "localhost"),
 * prints the authorization link, and after you approve it prints the refresh
 * token. Nothing is written to disk. Copy the token into Vercel as
 * SPOTIFY_REFRESH_TOKEN (Preview and Production). The token belongs to this
 * client id: issuing it with another app, or removing the app's access at
 * spotify.com/account/apps, revokes it.
 */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:http";

const PORT = 3000;
const REDIRECT_URI = `http://127.0.0.1:${String(PORT)}/api/auth/callback`;
const SCOPES = "user-read-currently-playing user-read-recently-played";

const toVercel = process.argv.includes("--vercel");
const vercel = (args: string[], input?: string) =>
  execFileSync("pnpm", ["exec", "vercel", ...args], { input, stdio: [input === undefined ? "inherit" : "pipe", "inherit", "inherit"] });

/** The two client values from the linked Vercel project, read from a private temporary file. */
function clientFromVercel(): { id?: string; secret?: string } {
  const dir = mkdtempSync(path.join(tmpdir(), "spotify-token-"));
  const file = path.join(dir, ".env");
  try {
    vercel(["env", "pull", file, "--environment=development", "--yes"]);
    const values = new Map<string, string>();
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = /^(SPOTIFY_CLIENT_(?:ID|SECRET))="?([^"]*)"?$/.exec(line);
      if (match?.[1] !== undefined && match[2] !== undefined) values.set(match[1], match[2]);
    }
    return { id: values.get("SPOTIFY_CLIENT_ID"), secret: values.get("SPOTIFY_CLIENT_SECRET") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const client = toVercel ? clientFromVercel() : { id: process.env.SPOTIFY_CLIENT_ID, secret: process.env.SPOTIFY_CLIENT_SECRET };
const { id, secret } = client;
if (id === undefined || id === "" || secret === undefined || secret === "") {
  console.error(
    toVercel
      ? "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are not in the Vercel project (development). Run `pnpm vercel login` if needed."
      : "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (from developer.spotify.com/dashboard), or use --vercel."
  );
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
      console.warn(`\nScopes: ${body.scope ?? ""}`);
      if (toVercel) {
        // One environment at a time: --force on several at once splits the entry (see the Vercel notes).
        for (const [environment, sensitive] of [
          ["production", true],
          ["preview", true],
          ["development", false],
        ] as const) {
          vercel(
            [
              "env",
              "add",
              "SPOTIFY_REFRESH_TOKEN",
              "--environment",
              environment,
              "--force",
              "--yes",
              sensitive ? "--sensitive" : "--no-sensitive",
            ],
            body.refresh_token
          );
        }
        console.warn("\nSPOTIFY_REFRESH_TOKEN updated in production, preview and development. Redeploy to use it.");
      } else {
        console.warn(`SPOTIFY_REFRESH_TOKEN=${body.refresh_token}\n`);
      }
    }
    server.close();
  })();
});

server.listen(PORT, "127.0.0.1", () => {
  console.warn(`Open this link, approve, and come back:\n\n${authorize.toString()}\n`);
});
