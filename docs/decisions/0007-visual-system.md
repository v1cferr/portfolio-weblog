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
