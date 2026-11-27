# Tattoos page

`/tattoos` ("Personal architecture") renders `content/profile/tattoos.yaml`: the
manifesto line, one card per tattoo and, in their own section, ideas that are
not tattoos yet. The long story is the post
`weblog/2026/11/personal-architecture-lion-and-usb`, linked both ways.

## The file

| Field                 | What it holds                                                              |
| --------------------- | -------------------------------------------------------------------------- |
| `status`              | `review` shows only on previews (ADR 0019); `published` puts it live       |
| `manifesto`           | A quote: `text` verbatim, `language` (default `pt-br`), `gloss` per locale |
| `post`                | Slug of the companion post; linked only while the post is visible          |
| `tattoos[].id`        | The card's anchor (`/tattoos#usb-trident`); never change it once published |
| `tattoos[].state`     | `done`, or `idea` (no date and no photo allowed: never shown as a tattoo)  |
| `tattoos[].date`      | `{ on: 2024, approximate: true, part: early }`, or `{ on: 2024-02-10 }`    |
| `tattoos[].placement` | Where it is on the body, per locale                                        |
| `tattoos[].quotes`    | The owner's words, verbatim; `[…]` marks an elided part                    |
| `tattoos[].media`     | A photo prepared with `pnpm media:add` (see [add photos](add-media.md))    |

Cards are listed newest first. An approximate date reads "around late 2023";
when the day is known, replace `approximate` and `part` with the date itself.

## Where it is linked

Few readers want this page, so it is not in the main nav or the footer. The way
in is the About page's curiosities: each tattoo's curiosity links to its card
(`/tattoos#<id>`), and its photo opens the card instead of the lightbox. The
explorer, sitemap and search list it too.

## Publishing

The page is published (2026-11-27). A status back to `review` in `tattoos.yaml`,
the post and the `usb-tattoo` curiosity hides it again: the About page drops its
links to `/tattoos`, and the explorer, sitemap and search leave the page out.

## Tests

`apps/web/e2e/tattoos.spec.ts` reads the status: published, it checks the page
on any build; in review, it checks that a plain build hides everything and the
page itself on a `CONTENT_PREVIEW=1` build:

```sh
CONTENT_PREVIEW=1 GITHUB_FIXTURES=1 pnpm build
cd apps/web && CONTENT_PREVIEW=1 pnpm exec playwright test e2e/tattoos.spec.ts
```
