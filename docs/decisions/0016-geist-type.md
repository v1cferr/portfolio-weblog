# 0016. Geist and Geist Mono for text and data, Martian Mono stays for display

- Status: accepted (2026-11-25, decided with the owner)
- Partly supersedes: [0007](0007-visual-system.md), its type pairing only

## Context

ADR 0007 set the type in a bake-off on 2026-10-23: Martian Mono for display,
Hanken Grotesk for text and JetBrains Mono for data. Geist was one of the four
pairings compared then, and lost to Hanken Grotesk.

A month later the owner asked for Vercel's typeface,
[Geist](https://vercel.com/font), and for the site to always use its own fonts,
never the visitor's system font. The options weighed on 2026-11-25:

| Option                   | Text           | Data           | Display      |
| ------------------------ | -------------- | -------------- | ------------ |
| Geist + Martian (chosen) | Geist          | Geist Mono     | Martian Mono |
| All Geist                | Geist          | Geist Mono     | Geist Pixel  |
| Keep                     | Hanken Grotesk | JetBrains Mono | Martian Mono |

## Decision

- **Geist for everything that is read, Geist Mono for dates, ids, paths and
  code.** The two are drawn together (same proportions and metrics), so text and
  data sit as one family. Geist is the typeface of the stack the site is built
  on (Next.js, Vercel), and it is under the SIL Open Font License 1.1.
- **Martian Mono stays for the name, page and section titles.** Geist is the
  default of many shadcn and Vercel templates; the display face is what keeps
  the site recognizable.
- **The fonts are the site's, not the system's.** `next/font` self-hosts all
  three, so for Latin text the visitor's system fonts never stand in for them;
  while they load, `display: swap` shows a fallback whose metrics are adjusted
  to match (`adjustFontFallback`), so nothing is invisible and nothing shifts.
- **What the site does not override:**
  - CJK text (zh-cn) keeps the system fonts. A CJK web font weighs megabytes,
    and the system ones are good.
  - A visitor who turns web fonts off in the browser, or forces their own font
    for accessibility, gets their choice. That is the reader's setting, and WCAG
    expects a page to survive it.
- **Share cards** use static Geist instances (400, 500) subset to Latin-1 and
  Latin Extended-A, like the files they replace (Satori reads TTF only).

## Consequences

- One family fewer to load: Geist and Geist Mono replace Hanken Grotesk and
  JetBrains Mono, and Martian Mono is unchanged.
- One reviewer reports Geist renders less crisply than Inter at small body sizes
  under Windows ClearType. The site's smallest text is the mono metadata at 12
  px; check it on Windows when possible, and raise it if needed.
- ADR 0007's palette, glass, motion and components stand; only its type pairing
  is superseded.
