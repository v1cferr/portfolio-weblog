# 0003. pnpm workspaces, no Turborepo

- Status: accepted (2026-10-09)
- Jira: PWL-99

## Context

The shadcn/ui monorepo template scaffolds Turborepo. The repository has one app
and five small packages (`config`, `content`, `github`, `search`, `ui`) that are
consumed as TypeScript source, with no build step of their own.

## Decision

Use pnpm workspaces only. Root scripts fan out with `pnpm -r` / `pnpm --filter`.
Packages export `.ts` source and the app compiles them through
`transpilePackages`. The shadcn monorepo layout is kept (a `components.json` in
`apps/web` and in `packages/ui`, `@workspace/ui/*` exports).

## Consequences

- One less tool and config file. Full validation takes well under a minute
  locally.
- No task caching. Revisit Turborepo if CI time becomes a problem or packages
  gain build steps.
