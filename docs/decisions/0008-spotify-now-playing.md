# 0008. Spotify "now playing" returns, on the server's terms

- Status: accepted (2026-11-22, decided with the owner)
- Partly supersedes: [0004](0004-drop-supabase-and-personal-integrations.md),
  for Spotify only

## Context

ADR 0004 left all of v1's personal integrations behind, Spotify included. The
owner wants the Spotify player back, modernized, showing what they are listening
to when someone visits. v1's version had a login route and a callback route (one
returned raw tokens) and passed Spotify's whole response to the browser.

Spotify changed the rules in 2026: Development Mode apps need the owner on
Premium (from 2026-03-09), allow five authorized users, and the quota counts per
developer account (2026-07-23). Reading one's own account fits all of it.

## Decision

- **Server only.** `lib/spotify.ts` (`server-only`) holds `SPOTIFY_CLIENT_ID`,
  `SPOTIFY_CLIENT_SECRET` and `SPOTIFY_REFRESH_TOKEN`, caches the access token
  in memory and asks for the current track, else the last one played.
- **A small, fixed payload.** `/api/now-playing` returns only state, title,
  artists, album, the open.spotify.com link, the cover hash, progress and times
  (`lib/now-playing.ts`, unit-tested). Podcasts are skipped. Anything that fails
  becomes `off` and the hero keeps its caption.
- **Quota-friendly.** The response is CDN-cached (`s-maxage=20`,
  `stale-while-revalidate=40`), so visitors share upstream calls. The client
  polls every 30 s only while the tab is visible.
- **The real cover, attributed.** The cover comes straight from Spotify's CDN
  (`i.scdn.co/image/{hash}`, and only that host: the hash is validated).
  Spotify's icon, in its own green and never over the art, attributes the
  content as their guidelines require. A dithered cover was tried first and
  dropped on 2026-11-22 as too fussy.
- **No login route.** The refresh token is issued once with a local script
  (`pnpm --filter web spotify:token`) that prints it and writes nothing.

## Consequences

- The player depends on the owner's Premium subscription. Without it, or without
  the variables, the site shows the caption and nothing breaks.
- What the owner plays is public while they play it, by choice. Spotify's
  Private Session hides it (the API answers 204).
- The rest of ADR 0004 stands: no Supabase, no WoW page, no Sheets-backed page.

## Revision (2026-11-22, tap to open)

On phones the header chip linked straight to Spotify, and the hover card never
opened on touch, so a tap left the site unannounced and could read as if the
page itself were playing music.

- **The chip is a button** that opens the card (a Popover) on a tap or a click;
  a mouse still opens it on hover, and a click after hovering pins it. Esc or a
  tap outside closes it.
- **The track is the link.** In the card, the cover and title link to the track
  on Spotify in a new tab, with a hover hint ("Open in Spotify"); the separate
  "listen" link is gone. The Spotify icon stays beside the linked metadata.
- **"Listening now"** replaces "Playing now on Spotify", so it reads as the
  owner listening rather than the page playing.
