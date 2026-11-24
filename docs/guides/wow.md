# World of Warcraft page

`/wow` lists the owner's WoW Forever and Retail characters, their add-ons and a
mount wishlist, from `content/games/wow.yaml`. Battle.net keeps levels, gear and
renders current once a day; the file is what shows when it does not answer. ADR
0015 has the why.

## 1. Create the Battle.net app (once)

1. Log in at <https://develop.battle.net/access/clients> and create a client.
2. **Redirect URL:** `http://localhost:8788/callback`. It is used only by
   `pnpm wow:sync` on your machine; the site never logs anyone in. To use
   another port, register that one and set `WOW_SYNC_PORT`.
3. Copy the **Client ID** and **Client Secret**.

## 2. Give the site the keys

In Vercel, add both as server-only variables in **Production** (and Preview if
you want live data there), one environment at a time:

```sh
printf '%s' "<client id>" | pnpm exec vercel env add BATTLENET_CLIENT_ID production
printf '%s' "<client secret>" | pnpm exec vercel env add BATTLENET_CLIENT_SECRET production --sensitive
```

Redeploy. Without them the page renders from the file and the server logs "World
of Warcraft live data unavailable".

## 3. Check the privacy setting

Battle.net answers 404 for every character unless **Community Sites and Apps**
is on: <https://account.battle.net> → Privacy → Game Data and Profile Privacy. A
character appears only from level 10, and only after it logs out once. WoW
Forever renders can take hours to show up after that.

## 4. Map the characters (`pnpm wow:sync`)

```sh
BATTLENET_CLIENT_ID=… BATTLENET_CLIENT_SECRET=… pnpm wow:sync
BATTLENET_CLIENT_ID=… BATTLENET_CLIENT_SECRET=… pnpm wow:sync --region us --region eu
```

It prints a Battle.net link; log in, approve `wow.profile`, and come back. It
reads the account's Retail (`profile-{region}`) and WoW Forever
(`profile-forever-{region}`) characters, merges them into
`content/games/wow.yaml` and prints what it added, updated and did not see. The
token stays in memory and nothing else is written. Then review the file, run
`pnpm content:check` and commit.

Run it again whenever you create a character. It refreshes class, race, faction,
level, realm and ruleset, and keeps what you edit by hand:

| Field        | Who writes it  | What it does                                                  |
| ------------ | -------------- | ------------------------------------------------------------- |
| `live`       | you (default)  | Ask Battle.net daily. New characters get it at the level cap. |
| `main`       | you            | Listed first, with a "Main" badge.                            |
| `note`       | you            | A line under the character, per locale.                       |
| `visibility` | you            | `private` keeps a character in the file and off the page.     |
| `armoryUrl`  | sync, then you | Retail gets one; add Forever's by hand if you want a link.    |
| `ruleset`    | sync           | Forever only: `normal`, `pvp`, `rp`, `rp-pvp` or `hardcore`.  |

## WoW Forever is undocumented

Blizzard has not documented Forever's profile API. The site asks
`/profile/wow/character/{name}-{surname}?namespace=profile-forever-{region}`, a
route the community found in November 2026
([60334](https://us.forums.blizzard.com/en/blizzard/t/wow-forever-api-what-works-so-far-plus-a-ts-client/60334),
[59774](https://us.forums.blizzard.com/en/blizzard/t/59774)). If it stops
answering, the card falls back to the snapshot; set `live: false` on the
character to stop asking.

## Add-ons

The list is read from the dotfiles (`pkgs/wow-addons/sources.json`) once a day,
so a new add-on shows up without touching this repository. To place it in a
group instead of "Other", add its key to a group in `addons.groups`; to fix how
its name reads, add it to `addons.names`. Refresh the vendored fallback with
`pnpm --filter web wow:addons` now and then.

## Refreshing on demand

Live data is cached for a day under the tag `wow`. To refresh sooner, redeploy,
or invalidate the `wow` tag in Vercel's cache.
