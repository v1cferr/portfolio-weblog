# Link to an element of a page

Every shareable element on the site has a stable id, so a URL fragment can point
at it, from another page of the site, from a post or from a message:

```text
https://v1cferr.dev/pt-br/setup#mousepad-redragon-alianca
```

The page opens with the element just below the floating header, and the element
glows briefly in the sage accent (a static outline when the visitor reduces
motion). Hovering an element, or tabbing to it, shows a small `#` button that
copies that URL and puts the fragment in the address bar.

## How ids are formed

Ids come from content ids, never from translated text, so a link works in every
locale. They are lowercase kebab-case ASCII, unique on their page.

| Page             | Element                    | Id                                     | Example                              |
| ---------------- | -------------------------- | -------------------------------------- | ------------------------------------ |
| `/setup`         | Group heading              | `setup-<group id>`                     | `setup-peripherals`                  |
| `/setup`         | Item, current or retired   | `id` of the item in `setup.yaml`       | `mousepad-redragon-alianca`          |
| `/about`         | Section heading            | Fixed name                             | `stack`, `principles`, `curiosities` |
| `/about`         | Curiosity                  | `curiosity-<id>`                       | `curiosity-alliance-mousepad`        |
| `/about`         | Recommendation             | `recommendation-<id>`                  | `recommendation-julio-cesar-raveli`  |
| `/career`        | Experience                 | Experience id                          | `fai-ufscar-2026`                    |
| `/career/<id>`   | Section heading            | Fixed name                             | `responsibilities`, `evidence`       |
| `/education`     | Study, certificate         | Entry id                               | `hackers-do-bem-cybersecurity`       |
| `/timeline`      | Entry                      | `<kind>-<entity id>[-<position>]`      | `project-portfolio-weblog`           |
| `/decisions`     | Decision                   | `adr-<number>`                         | `adr-0011`                           |
| `/decisions/<n>` | Heading of the record      | Heading slug (rehype-slug)             | `consequences`                       |
| `/weblog/<slug>` | h2 and h3 of the post      | Heading slug (rehype-slug)             | `content-is-the-source-of-truth`     |
| `/now`           | Update                     | `now-<date>`                           | `now-2026-11-23`                     |
| `/projects/<id>` | Repository languages       | Fixed name                             | `languages`                          |
| `/wow`           | Section heading            | `wow-<section>`                        | `wow-addons`                         |
| `/wow`           | Character                  | `wow-<game>-<name>-<realm or surname>` | `wow-retail-viictororc-gallywix`     |
| `/wow`           | Add-on group, wished item  | `addons-<group>`, `wow-wish-<item>`    | `addons-interface`                   |
| Any page         | Section heading with an id | The `id` given to `SectionHeading`     | `featured`                           |

Setup items carry their id in `content/profile/setup.yaml`: the kind of part and
the model, as in `mouse-razer-deathadder-v2`. The schema rejects a repeated id.
Once published, an id is a public URL: keep it when the model text changes.

Post headings follow the heading text (GitHub's slug rules), so renaming a
heading breaks links to it; the other ids do not depend on any text.

## Link to an element

From content, put the fragment in the internal link (`href` of a curiosity, a
Markdown link in a post):

```yaml
href: /setup#mousepad-redragon-alianca
```

```md
My [mousepad](/setup#mousepad-redragon-alianca) is the Alliance one.
```

Client-side navigations scroll to the element after the page transition and
highlight it too. A language switch keeps the fragment and the reader's place
without highlighting it again ([UI state](ui-state.md#the-language-switch)).

### Smooth jumps

In-page jumps glide: `html { scroll-behavior: smooth }` in
`packages/ui/src/styles/globals.css` covers fragment links, the `#` button and
`scrollIntoView`. It sits inside
`@media (prefers-reduced-motion: no-preference)`, so a reader who reduces motion
gets instant jumps. Wheel and touch scrolling stay native.

A route change must not glide from the footer to the top of the next page.
`<html data-scroll-behavior="smooth">` (the `[locale]` layout) tells Next.js the
document scrolls smoothly, and it switches smoothness off while it resets the
scroll on a navigation. Code that corrects the position, like the
`ScrollKeeper`, passes `behavior: "instant"`, which overrides the CSS. The e2e
suite (`apps/web/e2e/smooth-scroll.spec.ts`) checks all three: smooth by
default, instant with reduced motion, and a route change that jumps to the top
without passing through the positions in between.

## Make a new element linkable

- A section heading: give `SectionHeading` an `id`. It gets the button and the
  highlight; pass `anchor={false}` for a heading that is only a label.
- Another heading: use `AnchorHeading` (`components/anchor/anchor-heading.tsx`).
- An item: put the `id` and `data-anchor=""` on it, add the `group/anchor` class
  so hovering it shows the button, and render `<CopyLink id={id} name={…} />`
  inside it (or `nameId`, the id of the element that names it). Build the id
  with `anchorId()` from `lib/anchors.ts` when it joins several parts.
- A rail entry: set `id` on the `RailTimeline` entry; the rail adds the rest.

The e2e suite (`apps/web/e2e/deep-links.spec.ts`) fails when an id repeats on a
main page or a linkable element has no button.
