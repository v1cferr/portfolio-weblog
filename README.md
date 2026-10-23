# portfolio-weblog

Source of [v1cferr.dev](https://v1cferr.dev), the personal hub of Victor
Ferreira: career history, projects, studies and an engineering journal.

The hub is **content-first**. Every fact lives as structured, validated files in
[`content/`](content); the web app is one view of them. The goal is to keep
documenting a career for years without rebuilding the architecture at every
professional phase.

> v2 is developed on the `v2` branch. v1 is frozen at the tag
> `archive/pre-v2-2026-10-09` and still serves production from `main` until the
> switch is approved. See [docs/migration](docs/migration/README.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
shadcn/ui · Lucide · next-intl · MDX · Zod · pnpm workspaces · Nix flake ·
GitHub Actions · Vercel

## Getting started

```sh
nix develop          # or `direnv allow`: Node 22, pnpm 10, Playwright browsers
pnpm install
pnpm dev             # http://localhost:3000 → /en-us
```

Without Nix: Node 22 and pnpm 10 (`corepack enable`) are enough for everything
except the end-to-end tests, which then need
`pnpm --filter web exec playwright install chromium`.

Optional variables are documented in [`.env.example`](.env.example). Nothing is
required to run.

## Commands

| Command                      | What it does                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`                   | Development server for `apps/web`                                              |
| `pnpm build` / `pnpm start`  | Production build / serve it                                                    |
| `pnpm validate`              | Format check, lint, typecheck, content check and unit tests (what CI gates on) |
| `pnpm content:check`         | Validates `content/`: schemas, ids, references, dates, visibility              |
| `pnpm test`                  | Unit tests (Vitest) in every package                                           |
| `pnpm --filter web test:e2e` | Playwright smoke and accessibility tests (after `pnpm build`)                  |
| `pnpm format`                | Prettier                                                                       |

## Layout

```text
content/        profile, experiences, projects, education, weblog, taxonomies
apps/web/       the Next.js site
packages/       content (schemas, registry, timelines) · github · search · ui · config
docs/           architecture, decisions (ADRs), guides, migration
```

## Documentation

- [Architecture overview](docs/architecture/overview.md) and
  [content model](docs/architecture/content-model.md)
- Guides: [add an experience](docs/guides/add-experience.md),
  [add a project](docs/guides/add-project.md),
  [publish an article](docs/guides/publish-post.md),
  [deploy and preview](docs/guides/deploy.md)
- [Visibility rules](docs/architecture/visibility.md): what can and cannot
  become public
- [Decisions](docs/decisions/README.md)

## License

[Personal Hub License (PHL) v1.0](LICENSE): the code may be read for reference;
the content and the design may not be reused without permission.
