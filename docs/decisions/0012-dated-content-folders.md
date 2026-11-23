# 0012. Weblog posts in dated folders, with unchanged URLs

- Status: accepted (2026-11-23)
- Refines: [0001](0001-content-first.md)

## Context

Posts lived in `content/weblog/<slug>/<locale>.mdx`, one flat folder. That reads
fine with three posts and badly with fifty: the tree says nothing about when a
post was written, and the owner browses `content/` as often as the site. The
public URLs, `/[locale]/weblog/<slug>`, had just been indexed by search engines,
so moving the files could not move the pages.

## Decision

- Posts live in `content/weblog/<YYYY>/<MM>/<slug>/<locale>.mdx` (option "d1").
  The year and month only organize the tree. The slug is still the id, the URL
  and the link between translations; no redirect is needed.
- **The folder follows `publishedAt`.** The validator fails when a post's
  `publishedAt` disagrees with its folder (only the year is checked when
  `publishedAt` has no month), and names the folder it belongs in.
- **Drafts without `publishedAt`** go under the year and month of the commit
  that first added them (`git log --diff-filter=A --format=%as -- <dir>`). That
  is a convention, not a check: CI clones can be shallow. When the draft gets a
  `publishedAt` in another month, the validator asks for the move, and `git mv`
  keeps its history.
- **Slugs stay globally unique.** The loader rejects the same slug in two dated
  folders, and anything under `weblog/` that is not a four-digit year or a
  two-digit month, so the old flat layout cannot come back by accident.
- Other entities (projects, experiences, education) stay flat: they are
  evergreen and their dates are ranges, not a single publication moment.

## Consequences

- `PostSource` gains `dir` (the post's folder) and `folderDate` (`YYYY-MM`).
  Code that hashes or links a post's files uses `dir`, never `weblog/${slug}`;
  pages, RSS, the sitemap and search keep using the slug.
- Moving a post between months changes its share card's store-path hash (the
  hash covers relative paths), which is intended: the files did change.
- The tree doubles as a chronological index, which the site's file explorer
  mirrors as `~/weblog/<YYYY>/<MM>/<slug>`.
