# Performance

Every page is prerendered: SSG, or ISR at 86400 s where GitHub or Blizzard data
is involved. The server side is already fast (a cache hit answers in about
140–180 ms from Brazil). The weight sits on the client: the JavaScript the
shared layout ships to every page, and the RSC payload inlined in each HTML.

## How to measure

```sh
scripts/perf-snapshot.sh                                  # production, en-us
scripts/perf-snapshot.sh https://<preview>.vercel.app      # a preview
```

Per page, it prints the time to first byte, the HTML (raw and brotli), the RSC
payload inside the HTML, the JS and CSS the page references (brotli, summed per
page) and the number of `<link rel="preload">`. Run it twice: the first run can
hit a cold ISR cache.

To see which modules make up the JS:

```sh
cd apps/web
pnpm exec next analyze            # interactive UI on :4000
pnpm exec next analyze -o         # writes .next/diagnostics/analyze
pnpm exec next analyze export --route '/[locale]/weblog' > .next/an.jsonl
```

The export is JSON Lines. `part` records carry a module's `compressed_size` per
output file, and `group` records with `kind: "async"` list the outputs that load
on demand.

## Baseline (2026-11-28, production, second run)

| Route                                  | TTFB   | HTML raw | HTML br | RSC raw | JS br | CSS br | Preloads |
| -------------------------------------- | ------ | -------- | ------- | ------- | ----- | ------ | -------- |
| `/en-us`                               | 171 ms | 415K     | 52K     | 220K    | 364K  | 29K    | 17       |
| `/en-us/about`                         | 149 ms | 370K     | 46K     | 193K    | 364K  | 29K    | 19       |
| `/en-us/setup`                         | 178 ms | 848K     | 76K     | 351K    | 367K  | 29K    | 4        |
| `/en-us/weblog`                        | 178 ms | 147K     | 21K     | 81K     | 361K  | 29K    | 4        |
| `/en-us/weblog/how-this-site-is-built` | 146 ms | 197K     | 32K     | 101K    | 364K  | 29K    | 4        |
| `/en-us/projects/portfolio-weblog`     | 180 ms | 208K     | 33K     | 114K    | 363K  | 29K    | 4        |

The JS is almost the same on every page (361–367K), so the layout is what ships
it, not the pages.

## Findings

From the analyzer (initial JS on `/[locale]/weblog`, compressed) and the HTML:

| Finding                                                                      | Size        |
| ---------------------------------------------------------------------------- | ----------- |
| `next` runtime + React DOM                                                   | ~215K       |
| `generated/icons.ts`, pulled into the client by `now-playing.tsx` for 1 icon | ~53K        |
| motion (`motion-dom` + `framer-motion`) in the initial chunks                | ~23K        |
| lucide-react                                                                 | ~11K        |
| vaul (`Drawer` of the chat dock, statically imported)                        | ~8K         |
| next-intl's ICU parser (`@formatjs/*`, `intl-messageformat`)                 | ~9K         |
| Company logos preloaded on home and about, light **and** dark variants       | 13–15 extra |
| `/` answers 307 to `/en-us`, one more round trip on a first visit            | —           |

The plan that comes out of this: cut the logo preloads (LCP), defer the widgets
that are not needed for the first paint (same look), measure the Cloudflare
proxy, and guard the result with Lighthouse CI and a budget.

## Budget

CI's `lighthouse` job ([ci.md](ci.md)) runs Lighthouse CI on the production
build: mobile preset with simulated throttling, 3 runs per page, the median
checked against `apps/web/lighthouserc.json`. Locally, with a Chromium
(`nix develop` provides one):

```sh
pnpm build
CHROME_PATH=<chromium> pnpm --filter web perf:lighthouse
```

| Check                                    | Limit       | Level | On 2026-11-28 (local) |
| ---------------------------------------- | ----------- | ----- | --------------------- |
| JavaScript transferred, project pages    | 435K (gzip) | error | 393K                  |
| JavaScript transferred, every other page | 360K (gzip) | error | 317–326K              |
| Largest Contentful Paint                 | 2.5 s       | error | 1.2–1.4 s             |
| Cumulative Layout Shift                  | 0.1         | error | 0                     |
| Total Blocking Time                      | 200 ms      | warn  | 115–303 ms (`/setup`) |
| Performance score                        | 90          | warn  | 93–99                 |

The weights are gzip, not brotli (`next start` does not serve brotli), and count
everything the page fetches during the run, including what loads at idle (the
phone sheet's vaul, the now-playing request). The limits are the measured values
plus about 10%: a regression fails the pull request, and real growth is a
conscious edit of the file, in the same pull request, with the reason.

TBT and the score follow the runner's CPU more than the code, so they warn
instead of failing. `/setup` is over the TBT line (a long page with many client
pieces) and is the next thing to look at.

## After the first pass (2026-11-28)

JavaScript per page, local production build, brotli (q11), chunks referenced by
the HTML:

| Page                                   | Before | After |
| -------------------------------------- | ------ | ----- |
| `/en-us`                               | 309K   | 253K  |
| `/en-us/setup`                         | 312K   | 256K  |
| `/en-us/weblog`                        | 306K   | 250K  |
| `/en-us/weblog/how-this-site-is-built` | 309K   | 254K  |

The home went from 17 preloads to 5, and the hero photo is fetched with
`fetchpriority="high"`.

## The RSC payload

Each HTML carries the server tree again as the RSC payload (up to 351K raw on
`/setup`). Most of it is the tree itself: Tailwind class strings repeated per
row, and the props of the few client components (the photo list of `/setup`, the
client message namespaces, the page Markdown behind "copy as Markdown"). Brotli
takes `/setup` from 848K to 76K, so trimming it would save little on the wire.
It stays as it is until a page shows a real cost (parse time in Lighthouse).

## The edge: Cloudflare in front of Vercel

DNS is on Cloudflare with the proxy on (orange cloud): requests reach a
Cloudflare edge, which forwards them, uncached (`cf-cache-status: DYNAMIC`), to
Vercel's edge in São Paulo (`gru1`), where the prerendered page is a cache hit.
Vercel
[advises against a proxy in front of it](https://vercel.com/kb/guide/cloudflare-with-vercel):
extra latency, two caches, and its firewall and bot detection lose the real
client.

Measured on 2026-11-28 from the owner's connection in Brazil, 12 interleaved
rounds. "Direct" pins the hostname to Vercel's anycast IP
(`curl --resolve v1cferr.dev:443:76.76.21.21`, which Vercel answers with a valid
certificate):

| Request                        | Proxied (median / p90) | Direct (median / p90) |
| ------------------------------ | ---------------------- | --------------------- |
| `/` (the 307 to `/en-us`)      | 163 / 170 ms           | 73 / 83 ms            |
| `/en-us`                       | 171 / 180 ms           | 78 / 86 ms            |
| `/en-us/weblog`                | 150 / 180 ms           | 80 / 91 ms            |
| A CSS chunk (`/_next/static/`) | 120 / 122 ms           | 50 / 71 ms            |

The proxy adds about 70–90 ms to every request, the HTML and each asset the page
needs before it can paint. A first visit to `/` pays that twice, for the
redirect and for the page. These numbers are from a single location; the gap
abroad depends on how far the Cloudflare and Vercel edges are from each other.

What the proxy gives today:
[the managed robots.txt](../guides/seo.md#cloudflares-managed-robotstxt), with
the AI training crawlers blocked and a `Content-Signal` line. Going DNS-only
(grey cloud) would mean writing those rules into `app/robots.ts`. The decision
is the owner's; nothing changes until then.

### The redirect at `/`

`/` answers 307 to the visitor's locale (next-intl reads `Accept-Language`). It
is one extra round trip, but only on the bare domain: shared links and search
results point to `/en-us/...` or `/pt-br/...`. Serving a locale at `/` without
the redirect would change the canonical URLs (`localePrefix: "always"`), so it
stays.
