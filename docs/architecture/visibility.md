# Visibility rules

The site is public. Being accessible to the author does not make something
publishable.

1. An entity is public only when `status: published` **and**
   `visibility: public`.
2. The public registry drops everything else and prunes references to it, so a
   page cannot link to a hidden entity by accident. Pages, sitemap, RSS, search
   corpus and structured data all read from that registry.
3. Public content must not reference `private` content (validation error): the
   link itself would disclose that the private entity exists.
4. An entity whose organization is hidden is hidden too.
5. `pendingReview` holds unverified claims (e.g. v1 impact metrics). No
   component reads it.
6. GitHub data is enrichment: a repository is linked only while the API lists it
   as public, and private repositories are filtered even if a token could see
   them.
7. No secret reaches the browser: `GITHUB_TOKEN` is read only in server modules
   marked `server-only`, and client components receive only the message
   namespaces they need.
8. Not migrated from v1 on purpose: phone number, birth date, geotagged photos,
   family photos, names of colleagues, private repositories.
9. Images referenced by content must carry no EXIF, XMP or IPTC metadata (GPS,
   device, time); `pnpm content:check` fails otherwise and `pnpm media:add`
   prepares them.
10. Preview deployments answer `robots.txt` with `Disallow: /`.

Tests cover rules 1–4 (`packages/content`), 2 for search (`packages/search`), 6
(`packages/github`) and the 404s for hidden entries (`apps/web/e2e`).
