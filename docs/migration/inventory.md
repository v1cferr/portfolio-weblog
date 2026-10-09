# v1 migration inventory

Audit of `archive/pre-v2-2026-10-09` (2026-10-09). Each v1 item is in exactly
one class:

- **Migrate**: the knowledge moves into `content/` as structured data.
- **Rebuild**: the feature exists in v2, written from scratch.
- **Legacy only**: stays recoverable through the tag; not part of v2.
- **Discard**: not carried into v2 at all.

## Content and data

| v1 item                                                         | Class                | Notes                                                                                                                                                                                                           |
| --------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Career entries in `components/Professional/Career/Timeline.tsx` | Migrate              | Roles and dates become `content/experiences/*.yaml`. Impact metrics ("98%", "50%", "30%", "50+ bugs", "1,000+ files", "200+ items") cannot be verified, so they move to `pendingReview` and are never rendered. |
| "Software-AI Developer, Freelance, Apr 2024 – present"          | Migrate (not public) | Kept in `pendingReview` until the author confirms it.                                                                                                                                                           |
| FAI.UFSCar                                                      | Migrate (not public) | No role or date anywhere in v1 or Jira; created with `status: review`.                                                                                                                                          |
| Learnings per company (Jira PWL-33)                             | Migrate              | Qualitative, written by the author.                                                                                                                                                                             |
| `src/data/TechStackData.ts`                                     | Migrate              | Names become `content/taxonomies/technologies.yaml`; react-icons and colour classes are dropped.                                                                                                                |
| `src/data/SocialLinksData.ts`                                   | Migrate              | Email, GitHub, LinkedIn, X, Monkeytype. **WhatsApp number is not migrated** (personal phone).                                                                                                                   |
| `src/data/SetupData.ts` hardware list                           | Migrate              | Real data. Setup photos are not migrated (6 carry GPS EXIF, one shows a family member).                                                                                                                         |
| `src/data/HeroData.ts` quotes                                   | Migrate              | Profile `quotes` field.                                                                                                                                                                                         |
| `src/data/ProjectsData.ts`                                      | Discard (5 of 6)     | Ids 2–6 are placeholders (`github.com/username/*`, `example.com`). Id 1 (SpendFlow) points to a private repository and is not migrated. Projects are re-curated from public repositories.                       |
| `src/utils/calculateAge.ts` birth date                          | Discard              | Personal data; v2 shows no age.                                                                                                                                                                                 |
| `/context` essay                                                | Legacy only          | Long personal narrative; the About page is rewritten from structured profile content instead.                                                                                                                   |
| `/thanks`                                                       | Discard              | Labelled "mock temporário"; its images never existed.                                                                                                                                                           |
| `/goals`                                                        | Legacy only          | One image and an external video link.                                                                                                                                                                           |
| `public/company-logos/*`                                        | Migrate              | Used by organization entries.                                                                                                                                                                                   |
| `public/favicon/*`, `public/v1cferr-logo.*`                     | Migrate              |                                                                                                                                                                                                                 |
| `public/pictures/me/20260212154431.jpg`                         | Migrate              | Re-encoded without EXIF metadata. The full-resolution original is not migrated.                                                                                                                                 |
| `public/pictures/20240926085333.jpg`, `public/pictures/setup/*` | Legacy only          | GPS EXIF; unused in v2.                                                                                                                                                                                         |
| `public/profissoes-2025-2030.png`                               | Legacy only          | Used only by `/goals`.                                                                                                                                                                                          |
| `public/languages/*.json`                                       | Rebuild              | Messages move to `apps/web/messages/` (no longer public static files). Existing zh-cn strings are kept.                                                                                                         |

## Features and integrations

| v1 item                                                                                      | Class       | Notes                                                       |
| -------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------- |
| Home, Career, Projects, Setup, 404                                                           | Rebuild     | Same URLs under `/{locale}/…`.                              |
| `/certifications` (stub)                                                                     | Rebuild     | Becomes part of `/{locale}/education`; old URL redirects.   |
| i18n (`en-us`, `pt-br`, `zh-cn`, default `en-us`, prefix always)                             | Rebuild     | Same locales and prefixes. See `docs/architecture/i18n.md`. |
| Theme toggle, locale switcher, header menu                                                   | Rebuild     | shadcn/ui + Lucide.                                         |
| Spotify player, `/api/spotify`, `/api/login`, `/api/auth/callback`, `/api/currently-playing` | Legacy only | Decided 2026-10-09. See ADR 0004.                           |
| `/wow`, Battle.net routes, Supabase `blizzard_tokens`, `supabase/functions/*`                | Legacy only | ADR 0004.                                                   |
| `/vscode` + `/api/google/sheets`                                                             | Legacy only | ADR 0004.                                                   |
| WIP modal, `MenuData.ts` links to 14 non-existent routes                                     | Discard     | v2 only links to pages that exist.                          |
| Vercel Analytics / Speed Insights                                                            | Rebuild     | Kept; no secrets involved.                                  |

## Tooling

| v1 item                                                                           | Class       | Notes                                                                                             |
| --------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| Tailwind 3 + DaisyUI + tailwind-scrollbar                                         | Discard     | Tailwind 4 + shadcn/ui.                                                                           |
| react-icons, framer-motion, motion, axios, swr, focus-trap-react, `@svgr/webpack` | Discard     | Lucide; server components; no client data fetching.                                               |
| `flake.nix`                                                                       | Rebuild     | Node 22 + pnpm 10 kept; `deno` and `supabase-cli` dropped with the integrations that needed them. |
| ESLint / Prettier / Husky / lint-staged                                           | Rebuild     | Same conventions (Prettier width 140, double quotes), shared through `packages/config`.           |
| `Dockerfile`, `.dockerignore`                                                     | Legacy only | Vercel is the deploy target; can be rebuilt for `apps/web` when self-hosting is needed.           |
| `README.next.md`, `.vscode/daisyui.md`, `vsc-extensions.txt`                      | Discard     | Boilerplate and DaisyUI reference.                                                                |
| CI                                                                                | Rebuild     | v1 had none; v2 adds GitHub Actions.                                                              |

## Known v1 issues not carried over

- `/api/auth/callback` returned raw Spotify tokens to any caller, and the OAuth
  `state` was never checked.
- `/api/currently-playing` accepted an access token in the query string.
- The middleware matcher skipped unprefixed paths, so `/projects` returned 404.
- Root metadata description was the placeholder `"v1cferr - description"`.

These remain in the tagged history; the GPS EXIF data and phone number also
remain in Git history because rewriting it is out of scope (no history rewrite).
