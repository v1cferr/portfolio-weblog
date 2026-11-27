# 0019. Content in review shows on preview deployments

- Status: proposed (2026-11-26, with the tattoos page, for the owner to accept)
- Builds on: [0001](0001-content-first.md)

## Context

Every entity and post has an editorial status, and only `published` content
reaches a public surface. That rule held on preview deployments too, so a draft
could only be read as raw MDX in the pull request's "Files changed" tab or on a
local build. The owner wants to read a personal page and its post on the real
site, with the photos, the layout and both languages, before approving them.

Preview deployments are already private: they sit behind Vercel deployment
protection (only someone logged in to the team sees them), and `robots.txt`
disallows indexing there.

## Decision

- **`review` means "ready for the owner to read".** Public content in `review`
  renders on Vercel preview deployments (`VERCEL_ENV=preview`), with a notice
  saying it is not live. `draft` and `private` content stay hidden everywhere.
- **Production never shows it.** The switch is `SHOWS_REVIEW` in
  `apps/web/src/lib/preview.ts`, off whenever `VERCEL_ENV` is `production`.
  `CONTENT_PREVIEW=1` turns it on for a local build and for the e2e suite.
- **One option in the registry.** `includeReview` keeps the registry's usual
  pruning: references to drafts and private entities are still dropped, so a
  page in review cannot link to anything hidden. Content loaded outside the
  registry (the tattoos page, the About curiosities) follows the same switch.

## Consequences

- Approving content is one change: `status: review` → `published` (with
  `publishedAt` on a post), merged to `main`.
- Preview sitemaps, feeds and the search index include content in review; they
  are behind the same protection.
- CI builds without the switch, so the e2e suite checks that content in review
  is not found; its rendering is checked with a `CONTENT_PREVIEW=1` build.
