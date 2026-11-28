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

The plan that comes out of this: cut the logo preloads (LCP), trim the RSC
payload, defer the widgets that are not needed for the first paint (same look),
measure the Cloudflare proxy, and guard the result with Lighthouse CI and a
budget.
