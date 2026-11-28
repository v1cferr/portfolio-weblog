# 0021. Stay on Next.js, with a performance budget

- Status: accepted (2026-11-28)
- Builds on: [0002](0002-nextjs-as-backend.md),
  [docs/architecture/performance.md](../architecture/performance.md)

## Context

The owner wanted the site as fast as possible and asked whether moving it to
Astro would be worth it. Astro ships no JavaScript by default, and in published
comparisons of static blogs it lands near 0–8 KB of JavaScript against roughly
170–180 KB for Next.js.

Measured on 2026-11-28 (PR #153), the server side was already fast: every page
is prerendered, and a cache hit answers in about 150 ms from Brazil. The weight
was on the client: about 364 KB of brotli JavaScript on every page, sent by the
shared layout. Much of it was not the framework. 53 KB was an icon map pulled in
for one icon, vaul shipped to desktops that never use it, and 13 logo preloads
competed with the hero photo.

The site is not just a blog. It has the profile chat (ADR 0011), search, the
lightbox, shadcn/Radix components on every page, next-intl in three locales, ISR
with GitHub and Blizzard data, Open Graph images and API routes.

## Decision

- **Stay on Next.js.** In Astro, the chat, the search, the lightbox and the
  Radix components would become React islands, which bring React back, and the
  rewrite would cover about 20 pages in 3 locales plus the end-to-end suite.
  Most of the gain was available without it.
- **Trim what the code adds on top of the framework.** Interface icons get their
  own module, vaul loads only on phones, the now-playing poll waits for idle,
  and logos are lazy (PRs #154 and #155). Every page went from 364 KB to 300 KB
  of brotli JavaScript in production, and the home from 17 preloads to 5.
- **Guard it with a budget.** Lighthouse CI runs on every app change (PR #157).
  The script weight per page, LCP and CLS fail the pull request; TBT and the
  score warn, because they follow the runner's CPU.
- **Leave the edge to the owner.** The Cloudflare proxy in front of Vercel adds
  70–90 ms per request. Turning it off means moving its robots.txt rules into
  the app, and that is the owner's call
  ([performance.md](../architecture/performance.md#the-edge-cloudflare-in-front-of-vercel)).

## Consequences

- Most of what is left is the framework itself (React DOM and the App Router
  runtime), which Next.js cannot drop.
- A change that makes a page heavier fails CI. Growing the budget on purpose is
  an edit to `apps/web/lighthouserc.json`, with the reason, in the same pull
  request.
- **Revisit** if the budget can no longer be met in Next.js, or if the
  interactive parts (chat, search) move out of the shared layout. Then an Astro
  (or other islands) spike on the home and one post, measured the same way,
  decides.
