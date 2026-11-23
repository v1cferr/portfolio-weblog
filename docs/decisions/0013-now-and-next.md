# 0013. A dated "now" log and "next" plans, partly derived

- Status: accepted (2026-11-23)

## Context

The owner wanted the home page to say what they are doing these days, and a
place for what comes next (option "n1"). A "now" page goes stale quietly: it is
written once and then contradicts the rest of the site. Most of what it would
say (the current role, the projects in progress, the latest article) is already
in the content, and copying it into another file would make two sources for one
fact (ADR 0001).

## Decision

- **Content.** `content/now/<YYYY-MM-DD>.yaml` is one update each, named after
  its day: an optional localized `note`, localized `items` and an optional
  `place`. `content/now/next.yaml` holds the plans, with the `updatedAt` the
  page shows. Both carry `status` and `visibility` like every entity.
- **A log, not entities.** Updates have no ids or relations, so
  `packages/content` loads them on their own (`loadNow`), outside the registry;
  `content:check` validates them all the same.
- **Derived bullets.** The current role (`lib/current-role.ts`), the projects
  with `state: active` and the latest published article are computed when a page
  renders and shown under the newest update, after the owner's own bullets. They
  are never typed into YAML, and older updates do not get them.
- **Staleness.** After 90 days without an update the home card and /now are
  drawn muted and say "last updated N days ago". The site is static, so the age
  is computed when a page renders: at build time, then on each ISR revalidation.
  The home page and /now revalidate daily, so the count lags by at most a day;
  nothing runs in the browser for it.
- **Placement.** A compact card after the hero, linking to `/now`; `/now` and
  `/next` link to each other and are linked from the About page and the footer.
  The main navigation is full and stays as it is.
- **Machine-readable.** Each page has a section share card, a sitemap entry
  whose `lastModified` is the date it shows, `WebPage` JSON-LD whose
  `dateModified` is the same date, and documents in the search corpus.

## Consequences

- An update is one new file; the derived bullets keep themselves current.
- The date on the card is the owner's last update, not the last build, even
  though the derived bullets may be newer than it. /now says so.
- A long silence shows as such instead of passing for the present.
