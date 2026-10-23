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
