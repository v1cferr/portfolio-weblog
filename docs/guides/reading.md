# Reading a post

How a weblog post is laid out for long reading, and why. The styles live in
`.reading-surface` and `.prose-hub` (`packages/ui/src/styles/globals.css`); the
page is `apps/web/src/app/[locale]/weblog/[slug]/page.tsx`.

## The text

| Choice      | Value                                  | Why                                                                                                   |
| ----------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Line length | `max-width: 66ch`                      | 45 to 90 characters a line reads comfortably, 66 is the usual target ([Butterick][line], [UXPin][ux]) |
| Size        | 17px on phones, 18px from `md` up      | Body text on screens reads best at 15 to 25 px ([Butterick][size])                                    |
| Line height | 1.7                                    | About 1.5 or more for body text, more as lines get longer ([UXPin][ux])                               |
| Wrapping    | `text-wrap: pretty` on p, li, quotes   | Avoids a lone word on the last line of a paragraph ([Chrome][wrap])                                   |
| Punctuation | `hanging-punctuation: first allow-end` | Opening quotes hang in the margin where the browser supports it (Safari); others ignore it            |
| Quotes      | Full contrast, italic, accent rule     | They are my own words; grey text made them the hardest part to read                                   |
| Surface     | Plain page colour behind the text      | The dot grid and the glow stay around the page, never behind a paragraph                              |

Every size and gap is relative (`rem`, `em`, `ch`) and nothing has a fixed
height, so a reader who raises line, paragraph, letter or word spacing to the
WCAG 1.4.12 values loses nothing ([W3C][wcag]).

## On this page

A post with three or more `##`/`###` headings gets a contents list, built while
the MDX compiles (`renderMdx(source, { toc })`), so it links to the same anchors
the headings carry and works without JavaScript:

- from `lg` up, it sits in the gutter beside the text, sticky, and marks the
  section being read (`aria-current="location"`);
- below `lg`, it is a "Nesta página" disclosure above the text, closed by
  default and kept open or closed for the tab (see [UI state](ui-state.md)).

A jump from the list uses the site's smooth scroll and header offset
([deep links](deep-links.md)).

## Progress

A 2px bar at the top of the viewport fills as the text (not the whole page) is
read. It follows the scroll without easing, so there is no motion to switch off,
and it is `aria-hidden`: the scroll position already tells assistive technology
where the reader is.

## Tests

`apps/web/e2e/weblog-reading.spec.ts` (contents list, current section, jump,
disclosure, progress, no sideways scroll at 360px, axe in both themes) and
`apps/web/e2e/prose-code.spec.ts` (code block contrast).

[line]: https://practicaltypography.com/summary-of-key-rules.html
[size]: https://practicaltypography.com/point-size.html
[ux]: https://www.uxpin.com/studio/blog/optimal-line-length-for-readability/
[wrap]:
  https://developer.chrome.com/docs/modern-web-guidance/guides/visual-design/typography
[wcag]: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing
