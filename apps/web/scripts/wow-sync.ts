/**
 * Maps the owner's WoW characters into content/games/wow.yaml, once, on the
 * owner's machine (docs/guides/wow.md):
 *
 *   BATTLENET_CLIENT_ID=… BATTLENET_CLIENT_SECRET=… pnpm wow:sync [--region us] [--region eu]
 *
 * It is the only place a Battle.net user login ever happens (ADR 0015): the
 * site itself reads public profiles with client credentials. The script runs
 * the authorization code flow with PKCE against a listener on
 * http://localhost:8788/callback (WOW_SYNC_PORT changes the port; the URI must
 * be registered on the app at develop.battle.net), asks /profile/user/wow in
 * the Retail (profile-{region}) and WoW Forever (profile-forever-{region})
 * namespaces, and merges what it finds into the file: synced fields
 * (class, race, faction, level, realm, ruleset) are refreshed, the owner's
 * (live, main, note, visibility, armoryUrl) are kept, characters it did not see
 * stay. The token lives in memory only; nothing but the YAML is written.
 */
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";

import { findContentRoot, WOW_FILE, Wow, WowRegion } from "@workspace/content";
import { parseDocument } from "yaml";

import { apiHost, TOKEN_URL } from "../src/lib/battlenet";
import { mapAccountSummary, mergeCharacters } from "../src/lib/wow-sync";

const AUTHORIZE_URL = "https://oauth.battle.net/authorize";
const PORT = Number(process.env.WOW_SYNC_PORT ?? 8788);
const REDIRECT_URI = `http://localhost:${String(PORT)}/callback`;

const { values } = parseArgs({ options: { region: { type: "string", multiple: true, default: ["us"] } } });
const regions = values.region.map((region) => WowRegion.parse(region.toLowerCase()));

const { BATTLENET_CLIENT_ID: id, BATTLENET_CLIENT_SECRET: secret } = process.env;
if (id === undefined || id === "" || secret === undefined || secret === "") {
  console.error("Set BATTLENET_CLIENT_ID and BATTLENET_CLIENT_SECRET (from develop.battle.net/access/clients); see docs/guides/wow.md.");
  process.exit(1);
}

const base64url = (buffer: Buffer) => buffer.toString("base64url");
const verifier = base64url(randomBytes(32));
const challenge = base64url(createHash("sha256").update(verifier).digest());
const state = base64url(randomBytes(16));

const authorize = new URL(AUTHORIZE_URL);
authorize.search = new URLSearchParams({
  response_type: "code",
  client_id: id,
  scope: "wow.profile",
  redirect_uri: REDIRECT_URI,
  state,
  code_challenge: challenge,
  code_challenge_method: "S256",
}).toString();

/** Waits for Battle.net to send the browser back with a code. */
function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const url = new URL(request.url ?? "/", REDIRECT_URI);
      if (url.pathname !== "/callback") {
        response.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      if (url.searchParams.get("state") !== state || code === null) {
        response.writeHead(400).end("State mismatch or missing code; run pnpm wow:sync again.");
        server.close();
        reject(new Error(url.searchParams.get("error_description") ?? "authorization failed"));
        return;
      }
      response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("Done. You can close this tab.");
      server.close();
      resolve(code);
    });
    server.listen(PORT, "127.0.0.1", () => {
      console.warn(`Open this link, log in to Battle.net and approve, then come back:\n\n${authorize.toString()}\n`);
    });
  });
}

async function userToken(code: string): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id ?? ""}:${secret ?? ""}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI, code_verifier: verifier }),
  });
  const body = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || body.access_token === undefined) throw new Error(`token exchange failed: ${body.error ?? String(response.status)}`);
  return body.access_token;
}

const token = await userToken(await waitForCode());

const found: Record<string, unknown>[] = [];
const read = new Set<string>();
for (const region of regions) {
  for (const game of ["retail", "forever"] as const) {
    const namespace = game === "retail" ? `profile-${region}` : `profile-forever-${region}`;
    const url = new URL("/profile/user/wow", apiHost(region));
    url.search = new URLSearchParams({ namespace, locale: "en_US" }).toString();
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
    if (response.status === 404) {
      console.warn(
        `${namespace}: 404. No characters there, or "Community Sites and Apps" is off in the Battle.net privacy settings (characters appear from level 10, after a logout).`
      );
      continue;
    }
    if (!response.ok) {
      console.warn(`${namespace}: ${String(response.status)}; skipped.`);
      continue;
    }
    const { characters, skipped } = mapAccountSummary(game, region, await response.json());
    read.add(`${game}:${region}`);
    console.warn(
      `${namespace}: ${String(characters.length)} character(s)${skipped > 0 ? `, ${String(skipped)} skipped (missing fields)` : ""}.`
    );
    found.push(...characters);
  }
}

const file = path.join(findContentRoot(), WOW_FILE);
const doc = parseDocument(readFileSync(file, "utf8"));
const existing = (doc.toJS() as { characters?: Record<string, unknown>[] } | null)?.characters ?? [];
const merged = mergeCharacters(existing, found, read);

doc.set("characters", doc.createNode(merged.characters));
if (read.size > 0) doc.set("syncedAt", new Date().toISOString().slice(0, 10));
const check = Wow.safeParse(doc.toJS());
if (!check.success) {
  console.error(`The merged file would be invalid; nothing written:\n${check.error.message}`);
  process.exit(1);
}
writeFileSync(file, doc.toString());

const list = (title: string, names: string[]) => {
  if (names.length > 0) console.warn(`${title}:\n${names.map((name) => `  - ${name}`).join("\n")}`);
};
list("Added", merged.added);
list("Updated", merged.updated);
list("Not listed by Battle.net (kept)", merged.missing);
console.warn(`\nWrote content/${WOW_FILE}. Review it (live, main, notes), run pnpm content:check, and commit.`);
