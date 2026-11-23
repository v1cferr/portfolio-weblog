# 0007. Visual system: Tokyo Night, clear glass, lane backdrop

- Status: accepted (2026-10-23)

## Context

The owner wanted the site to feel original: a gradient, cards in glass like the
LG face of their lockscreen (`v1cferr/dotfiles`,
`quickshell/widgets/LiquidGlass.qml`), and a background that stays clean. Glass
only reads with something behind it, and both depend on the palette, so the
three were decided together.

Four static prototypes were rendered side by side (light and dark, desktop and
390 px): bokashi washes, commit-graph lanes, monogram geometry and a Tokyo Night
aurora, each with two palettes (Tokyo Night and the earlier tokens) and two
glass strengths (clear and frosted).

## Decision

- **Background: lanes.** The commit graph's four lane colours (career, project,
  study, writing) as faint vertical lines that fade down the page, plus a soft
  project-lane glow behind the hero. It is the site's own signature, not a
  generic gradient blob. `apps/web/src/components/backdrop.tsx` draws it with
  CSS only, fixed and `aria-hidden`.
- **Palette: Tokyo Night**, the owner's desktop palette: Night for dark, Day for
  light. The Day text, subtext and lane colours are darkened until they reach
  4.5:1 on the page and on glass. The vermilion hanko `#c4342c` is the only
  accent and is exposed as `--brand`.
- **Glass: clear.** `.glass` in `packages/ui/src/styles/globals.css` gives a
  translucent tint, a 24 px backdrop blur, a light hairline, a top sheen and a
  soft shadow. It falls back to the opaque card colour without `backdrop-filter`
  or under `prefers-reduced-transparency`. `Card` takes `variant="glass"`. The
  header, cards, trajectory and related links use it.

## Consequences

- No image is downloaded for the background, and no client code runs for it.
- Code blocks stay on a white panel in light mode, because the Shiki
  `github-light` colours need it to pass contrast.
- The axe checks in the e2e suite still run in both themes and still pass. Any
  new colour has to keep 4.5:1 over glass.

## Revision (2026-10-23, second round)

The owner found the result still "raw". A second bake-off compared three
palettes (Tokyo Night refined, Kanagawa, a Nippon-iro palette) and four type
pairings (Manrope, Geist, IBM Plex, Martian Mono with Hanken Grotesk).

- **Palette:** Tokyo Night stays. Light-mode text moves from Day's blue to ink
  (`#2a2e45`, subtext `#4c5373`), so links and lanes are the only colour in
  running text.
- **Type:** Martian Mono for the name, page titles, section headings and article
  h2s, narrowed with its `wdth` axis. Hanken Grotesk for everything else, and
  JetBrains Mono for data.
- **Flags:** round flags from circle-flags, with the language code next to the
  flag.
- **Components:** official shadcn components first (Kbd, Empty, Item,
  Collapsible, HoverCard), and site looks as `cva` variants (Badge `now` and
  `glass`, Item `glass`), so feature code does not repeat long class lists.
  Third-party registries only after review.
- **Signature:** the home page is a git log. A main line runs from a vermilion
  HEAD node at the name, and each section branches off in its lane's colour. The
  lines draw on scroll with CSS scroll-driven animations.

## Revision (2026-11-22, borderless glass)

The owner asked for stronger, cleaner glass without borders, across the whole
site. `.glass` now has a denser tint for legibility, `blur(32px) saturate(1.6)`,
a soft diffuse shadow and a fine top highlight as its only edge. Its border
stays in the box model but is transparent, so nothing shifts. Interactive
surfaces use `.glass-hover`, which deepens the tint and the shadow, instead of
drawing a border on hover. The header loses its bottom border. Without
`backdrop-filter`, or with reduced transparency, surfaces fall back to an opaque
card that gets its border back.

## Revision (2026-11-22, direction B with Nix)

The owner still found the frosted surfaces too solid. Four directions were
compared in an interactive artifact: living aurora, grid + spotlight, paper
minimal and grain gradient. The owner picked B (grid + spotlight) and asked for
more Nix and NixOS:

- **Background:** a faint dot grid on a 60° (hexagonal) lattice, the snowflake's
  geometry, fading from the top.
- **Surfaces:** content surfaces are nearly transparent and share one pointer
  spotlight in the project blue. Floating layers (header, cards over content,
  sticky pills) keep the frosted `.glass-float`.
- **NixOS logo:** the official logomark behind the hero, unmodified, revealed
  around the pointer. It is credited (CC BY 4.0) in the footer of every page and
  in the README.
- **Eyebrows:** page eyebrows are Nix store paths over a real SHA-256 of the
  page's content files, in Nix's base32.
- **Footer provenance:** the commit and the nixpkgs revision from `flake.lock`
  the build came from.

## Revision (2026-11-22, page transitions)

The owner chose "morph + slide" for navigation, built on React's
`<ViewTransition>` and the browser's View Transitions API (no animation library
involved, and browsers without the API just swap the page):

- **Morph:** a list entry's title (project card or timeline row, experience
  card, trajectory station or timeline row, post card) becomes the detail page's
  title. A name is unique per page, so an entity shown twice morphs from one
  place only.
- **Direction:** list to entry slides left (`nav-forward`), the "back to" links
  slide right (`nav-back`). Each `page.tsx` wraps its content, since layouts
  never enter or exit.
- **Sections:** the main navigation, the logo and "see all" links only crossfade
  (`nav-section`), with no morphs; sections are siblings.
- **Header:** named `site-header` and never animated, the fixed reference while
  the content moves. In it, the active section's pill slides between items
  (Motion shared layout, `layoutId`).
- **Reduced motion:** every view-transition duration is zero, and Motion swaps
  the pill without sliding.

## Revision (2026-11-22, Tokyo Night Day)

The owner found the light theme did not read as Tokyo Night. Four palettes were
compared in an artifact (today, Night + Day, Storm + Day, Tokyo Night accents);
the owner picked **Night + Day**:

- **Light is Day proper:** page `#e1e2e7`, Day's blue text, and Day's subtext,
  lane and red colours, each darkened from the original only as far as 4.5:1
  needs on the page, the glass, cards and the muted fill (text `#3155a9`,
  subtext `#4a5786`, career `#0d6756`, project `#2159a7`, study `#6e5531`,
  writing `#703eb2`). This replaces the ink text of the second revision.
- **Dark stays Night.** The vermilion hanko stays the only accent.
- The browser `theme-color` now matches both pages.

## Revision (2026-11-22, layered glass)

The owner wanted still more glass. Four strengths were compared in the same
artifact (today, clearer, layered, liquid); the owner picked **layered**:

- **Floating glass** (`.glass-float`): tint at 55% (light) and 42% (dark),
  `blur(40px) saturate(1.8)`, a brighter top sheen, an inner edge highlight and
  a gradient hairline rim on `::after`. Reduced transparency and browsers
  without `backdrop-filter` drop the rim and keep the opaque card.
- **Backdrop glows:** soft radial glows in the career, writing and project lane
  colours under the dot grid, so the glass has colour to pick up.
- **Header fix:** the `site-header` view-transition name moved from `<header>`
  to the pill. On the header it made a backdrop root, so the pill blurred
  nothing and the page showed through sharp. A test guards against any ancestor
  of the pill becoming a backdrop root.
- The liquid option (SVG refraction) was left out: Chromium only.

## Revision (2026-11-23, file explorer)

The owner picked "t1": the site as a file tree, as a second way to navigate.

- **What:** `~/` with `about`, `career/<id>`, `projects/<id>`,
  `weblog/<YYYY>/<MM>/<slug>` and the other sections, built from the content
  registry. Mono file names, localized titles next to them, lucide folder and
  file icons in the project lane colour. Dated folders are newest first.
- **Where:** on desktop, a `.glass-float` side panel opened from a `~/` button
  in the header; the main navigation stays as it is. Below `lg` the header has
  no room for one more button next to the now-playing chip at 360 px, so the
  tree is a closed `~/` section of the menu sheet, under the primary sections.
- **Accessibility:** nested `<nav aria-label>`, `<ul>`, `<details>`/`<summary>`
  and plain links, not the ARIA tree widget; `aria-current="page"` on the
  current page, whose folders open by themselves; 44 px rows on phones; no slide
  with reduced motion. Open folders persist in `localStorage` when it is
  available.

## Revision (2026-11-23, graphite + sage)

The owner found Tokyo Night too "pinkish": the purple end of the name gradient,
the purple backdrop glow, the magenta and red accents. He wanted the site darker
and cleaner, closer to his photo (black jacket, warm skin, grey-green wall), and
picked **C1, graphite + sage**, with the theme still following the system by
default. The direction follows what Vercel, Linear and Raycast do and what
Material's dark theme guidance asks for: neutral greys, one accent, colour only
where it means something, no pure black, elevation by a lighter surface, and
desaturated colours on dark.

- **Neutrals:** warm graphite with a faint green cast. Page, card and muted fill
  step lighter for elevation; borders stay solid tokens.
- **One accent:** sage teal, as `--primary`, `--ring` and `--brand` (the HEAD
  node, the "now" markers, the V1C watermark, the pointer spotlight). shadcn's
  `--accent` stays a neutral hover fill, since nav pills and menu rows put plain
  text on it. The vermilion hanko is retired.
- **Name:** plain foreground; the blue-to-purple gradient is gone.
- **Backdrop:** the dot grid stays; the three lane glows become one sage glow
  (8% in dark, 12% in light). The glass keeps its layers, retuned to graphite,
  and the pill's backdrop-root rule is untouched.
- **Lanes:** four distinguishable, desaturated hues, none pink, purple or
  magenta. Career is the accent; project is steel blue, study is sand, writing
  is olive. Light colours were fitted the PR #30 way, in ×0.97 steps towards
  black (towards white in dark), to at least 4.6:1 on every surface they sit on:
  the page, cards, popovers, the muted fill, the glass tint over the page and
  over the glow's centre, and the hover fills.
- **Share cards** and `theme-color` use the same values (the cards in dark). The
  ASCII avatar needed nothing: its ink is `currentColor`.

The lowest ratio is the worst of those surfaces; "page" is on the page alone.

| Token          | Light     | Lowest | Page  | Dark      | Lowest | Page  |
| -------------- | --------- | ------ | ----- | --------- | ------ | ----- |
| page           | `#f6f7f6` |        |       | `#0f1112` |        |       |
| card, popover  | `#ffffff` |        |       | `#16191a` |        |       |
| muted fill     | `#eceeed` |        |       | `#1e2223` |        |       |
| border         | `#d9dedc` |        |       | `#2a2f30` |        |       |
| text           | `#141717` | 14.28  | 16.79 | `#e6e8e6` | 13.03  | 15.37 |
| subtext        | `#5b6562` | 4.77   | 5.61  | `#9aa3a0` | 6.21   | 7.32  |
| accent, career | `#2f6f62` | 4.66   | 5.48  | `#7fb8a8` | 7.13   | 8.41  |
| project        | `#396795` | 4.69   | 5.51  | `#86a6c8` | 6.35   | 7.48  |
| study          | `#7c5d2b` | 4.81   | 5.66  | `#d4b07a` | 7.87   | 9.28  |
| writing        | `#5b6832` | 4.79   | 5.63  | `#a9b67e` | 7.40   | 8.73  |
| destructive    | `#b23a2e` | 4.70   | 5.53  | `#e0786c` | 5.41   | 6.38  |

Text on the accent passes too: white on `#2f6f62` is 5.88:1, and `#0f1112` on
`#7fb8a8` is 8.41:1. An e2e test checks, in both themes, that the name's colour
is the body's and that no accent or lane token has a hue between 250° and 345°.
