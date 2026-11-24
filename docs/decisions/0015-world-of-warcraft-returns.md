# 0015. World of Warcraft returns (server-only, client credentials)

- Status: accepted (2026-11-23, decided with the owner)
- Partly supersedes: [0004](0004-drop-supabase-and-personal-integrations.md),
  for the WoW page only

## Context

ADR 0004 left v1's World of Warcraft page behind with the rest of its
integrations. v1 read the owner's characters with his **user** token: a login
route, a callback that returned raw tokens, a Supabase table that existed only
to store them and a Deno edge function to refresh them, six secrets in all. When
the token expired, the page broke until someone logged in again.

The owner wants the page back. He plays WoW Forever most (Blizzard's Classic+
game, out since 2026-11-04: no realms, one mega-realm per ruleset and region,
characters named "Name Surname"), and has Retail characters he is not playing
now. He runs 53 add-ons, pinned and packaged with Nix in his dotfiles.

Battle.net serves public character profiles to any app with **client
credentials**; only the list of an account's characters (`/profile/user/wow`)
needs the user's login. WoW Forever has its own namespaces
(`profile-forever-{region}`), and its realmless profile route
(`/profile/wow/character/{name}-{surname}`) is undocumented: the community found
it in November 2026, and it was not always routed.

## Decision

- **The user login happens once, on the owner's machine.** `pnpm wow:sync` runs
  the authorization code flow with PKCE against a localhost listener, reads
  `/profile/user/wow` for Retail and Forever, and merges the characters into
  `content/games/wow.yaml`. Synced fields (class, race, faction, level, realm,
  ruleset) are refreshed; the owner's (`live`, `main`, notes, visibility, armory
  link) are kept. The token is never stored.
- **The runtime uses client credentials only.** `lib/blizzard.ts`
  (`server-only`) holds `BATTLENET_CLIENT_ID` and `BATTLENET_CLIENT_SECRET`,
  caches the token until a minute before it expires, and asks each character's
  profile and render through Next's data cache once a day (tag `wow`), with a 5
  s timeout. The client itself (`lib/battlenet.ts`) is pure and unit-tested.
- **The file is the floor.** No keys, 401, 403, 404, a timeout or a malformed
  answer leave the character as the file has it, marked as a snapshot with the
  sync date; live data is marked with its date. A character with `live: false`
  is never asked, which is how a Forever character can be switched off if the
  undocumented route stops answering.
- **Forever first, Retail second**, each in its own section; Retail says the
  owner is not playing it now. Until the first sync both show an empty state,
  never made-up characters.
- **Add-ons from the dotfiles.** The page reads `pkgs/wow-addons/sources.json`
  from GitHub once a day and groups it with `addons.groups` in the content; an
  add-on no group names is listed under "Other". A vendored copy
  (`src/generated/wow-addons.json`, `pnpm --filter web wow:addons`) stands in
  when GitHub does not answer and in CI. Each name links to its GitHub
  repository or CurseForge project, and the section links the Nix derivation.
- **Images.** Renders come only from `render.worldofwarcraft.com`, checked in
  the client, allowed in `images.remotePatterns` and in the CSP `img-src` (ADR
  0009). The mount wishlist links to Wowhead and hotlinks no image.
- **The route is back.** `/wow` no longer redirects to `/about`; About links to
  it, and it is in the explorer tree and the sitemap, with its own share card.

## Consequences

- The site needs two more server-only variables in Production. Without them the
  page still renders, from the file.
- The character list is only as fresh as the last `pnpm wow:sync`: a new
  character appears after the owner runs it and commits the file. Levels and
  gear stay current on their own.
- The Battle.net privacy setting "Community Sites and Apps" has to stay on, or
  both the sync and the profiles answer 404. Characters appear from level 10,
  after a logout; Forever renders can lag by hours.
- WoW Forever's profile route may change without notice. The page then shows the
  snapshot and logs a warning; nothing breaks.
- The rest of ADR 0004 stands: no Supabase, no database, no Sheets-backed page.
