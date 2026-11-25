# 0016. Geist and Geist Mono for the whole site

- Status: accepted (2026-11-25, decided with the owner; revised the same day,
  see below)
- Supersedes: [0007](0007-visual-system.md), its type pairing only

## Context

ADR 0007 set the type in a bake-off on 2026-10-23: Martian Mono for display,
Hanken Grotesk for text and JetBrains Mono for data. Geist was one of the four
pairings compared then, and lost to Hanken Grotesk.

A month later the owner asked for Vercel's typeface,
[Geist](https://vercel.com/font), and for the site to always use its own fonts,
never the visitor's system font. The options weighed on 2026-11-25:

| Option          | Text           | Data           | Titles                 |
| --------------- | -------------- | -------------- | ---------------------- |
| All Geist       | Geist          | Geist Mono     | Geist, semibold, tight |
| Geist + Martian | Geist          | Geist Mono     | Martian Mono           |
| Keep            | Hanken Grotesk | JetBrains Mono | Martian Mono           |

For the titles in "All Geist", Geist Mono (closest to the old monospace look)
and Geist Pixel (a display face, harder to read in long titles and not on Google
Fonts) were also considered.

## Decision

- **Geist for titles and everything that is read, Geist Mono for dates, ids,
  paths and code.** The two are drawn together (same proportions and metrics),
  so the site reads as one family. Geist is the typeface of the stack the site
  is built on (Next.js, Vercel), under the SIL Open Font License 1.1.
- **Titles are Geist semibold, set tight** (`tracking-tight`, the name on the
  home `tracking-tighter`), the way Vercel sets its own headings. The
  `font-display` class stays as the one hook for titles.
- **The fonts are the site's, not the system's.** `next/font` self-hosts both,
  so for Latin text the visitor's system fonts never stand in for them; while
  they load, `display: swap` shows a fallback whose metrics are adjusted to
  match (`adjustFontFallback`), so nothing is invisible and nothing shifts.
- **What the site does not override:**
  - CJK text (zh-cn) keeps the system fonts. A CJK web font weighs megabytes,
    and the system ones are good.
  - A visitor who turns web fonts off in the browser, or forces their own font
    for accessibility, gets their choice. That is the reader's setting, and WCAG
    expects a page to survive it.
- **Share cards** use static Geist (400, 500, 600) and Geist Mono (400, 600)
  instances subset to Latin-1 and Latin Extended-A, like the files they replace
  (Satori reads TTF only).

## Revision (2026-11-25)

The first version kept Martian Mono on the titles, as the face that made the
site recognizable among sites on Geist. After seeing it live, the owner chose
Geist everywhere: one family, the official one. Identity now comes from the
palette, the glass, the dot grid and the V1C mark rather than the title face.

## Consequences

- One family to load instead of three: Geist and Geist Mono replace Martian
  Mono, Hanken Grotesk and JetBrains Mono.
- Geist is the default of many shadcn and Vercel templates, so the type alone no
  longer sets the site apart; the rest of the visual system has to.
- One reviewer reports Geist renders less crisply than Inter at small body sizes
  under Windows ClearType. The site's smallest text is the mono metadata at 12
  px; check it on Windows when possible, and raise it if needed.
- ADR 0007's palette, glass, motion and components stand; only its type pairing
  is superseded.
