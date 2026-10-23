# Architecture overview

```text
content/                 YAML + MDX: the source of truth (ADR 0001)
packages/
  content/               schemas, loader, validation, public registry, timelines
  github/                public repository metadata (enrichment only)
  search/                normalized public documents for search and future retrieval
  ui/                    design system: shadcn/ui primitives, tokens, global CSS
  config/                shared tsconfig presets and ESLint flat configs
apps/web/                Next.js 16 app (App Router, React 19, Tailwind 4, next-intl)
  src/app/[locale]/      pages, all statically generated
  src/app/api/search/    per-locale search corpus (static JSON)
  src/features/          career, projects, timeline, weblog, search, profile
  src/components/        shell and shared presentational components
  src/lib/               server-only access to content, GitHub, dates, i18n, SEO helpers
e2e/ (in apps/web)       Playwright smoke and accessibility tests
docs/                    architecture, decisions (ADRs), guides, migration
```

## Data flow

```text
content/*.yaml, *.mdx
  → packages/content: load → validate (schemas, relations, dates, visibility)
  → public registry (drafts, review and private entries removed, and references to them pruned)
  → apps/web server components → static HTML
                               → sitemap, RSS, search corpus, Open Graph
GitHub API (public repos) → packages/github → apps/web/src/lib/github.ts (cached daily)
  → project facts, repository-creation fallback in timelines, uncurated repository list
```

Nothing reaches a public output without going through the public registry.

## Rendering

All pages are generated at build time. Pages that show GitHub data (home,
timeline, project pages, catalogue) revalidate daily. Client components are
limited to interaction: navigation state, the mobile menu, theme and locale
switchers, the search dialog and the project filters.

## Quality gates

`pnpm validate` runs Prettier, ESLint (type-aware, strict), TypeScript,
`content:check` and the unit tests. CI also builds the app and runs the
Playwright suite at phone and desktop sizes, including axe accessibility checks
in both themes.

See also: [content model](content-model.md), [visibility](visibility.md),
[timelines](timeline.md), [GitHub](github.md), [i18n](i18n.md),
[AI roadmap](ai-roadmap.md).
