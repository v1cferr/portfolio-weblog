# 0020. Turborepo with a remote cache runs only what changed

- Status: accepted (2026-11-28)
- Builds on: the CI split in [docs/architecture/ci.md](../architecture/ci.md)

## Context

CI ran every check on every push, even when the earlier run had already passed
the same code. After the end-to-end suite was sharded (PR #134), a run took
about 5½ minutes. A good part of that was work an earlier green run had already
done on the same inputs: install, lint, typecheck, unit tests and the build of
each package.

The owner asked for CI to analyze only what changed.

## Decision

- **Turborepo runs the workspace tasks.** The root `lint`, `typecheck`, `test`
  and `build` scripts call `turbo run …`, and `turbo.json` declares them. Each
  task's hash covers its package's files, its dependencies' files, the lockfile,
  the root `tsconfig` files and `content/` (the site reads it, but it isn't a
  package).
- **Remote cache on Vercel.** CI reads and writes the Vercel remote cache with
  `TURBO_TOKEN`, a team-scoped token the owner created and stored as an Actions
  secret, and `TURBO_TEAM`, a repository variable. A task whose hash matches a
  green run is restored, not run. Locally the cache lives in `.turbo/`, which is
  ignored.
- **The build is cached too.** `build` outputs `.next/**` without
  `.next/cache/**`. Its hash includes the build-time variables
  (`GITHUB_FIXTURES`, `NEXT_PUBLIC_*`, `CONTENT_DIR`, `CONTENT_PREVIEW`,
  `VERCEL_ENV`), so a fixture build never replaces a real one.
- **Loose environment mode.** Tasks see every variable, as before. Strict mode
  would hide the variables that aren't declared, and a missing runtime secret
  would only surface in production.
- **The end-to-end suite always runs** when the site changed. It drives the
  whole built site through a browser, so no import graph tells which specs a
  change touches.
- **Forks fall back.** A pull request from a fork gets no secret, so Turbo runs
  everything with an empty cache.

## Consequences

- A rerun on the same commit, or a commit that only touches one package,
  restores the rest from the cache.
- A task whose inputs are not declared (a file outside its package that it
  reads) could be wrongly restored. `content/` is the known one, declared as a
  global dependency. A new one goes in `turbo.json` the day it appears.
- The token can be revoked in Vercel. CI then just runs everything.
