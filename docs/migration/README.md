# Migration from v1 to v2

v2 of the Personal Hub is a rebuild, not an in-place refactor (PWL-97, PWL-98).
The central rule is **migrate knowledge, content and evidence; do not carry
technical debt just because it exists.**

## Where v1 lives

| Reference                                   | Points to                               | Purpose                                                                |
| ------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `archive/pre-v2-2026-10-09` (annotated tag) | `c41712c`                               | Frozen v1, the last commit deployed from `main` before v2 work started |
| `main`                                      | v1 until v2 is approved                 | Production (`v1cferr.dev`) keeps deploying from it                     |
| `v2`                                        | branched from `c41712c`, shared history | v2 development; Vercel builds preview deployments only                 |

The tag is never moved, recreated or deleted. `v2` is not an orphan branch, so
`git log` on it still shows the full v1 history, and `git blame` across the
rebuild works.

## Running v1 locally

```sh
git switch --detach archive/pre-v2-2026-10-09
nix develop            # or: direnv allow
pnpm install --frozen-lockfile
cp .env.example .env.local   # Spotify / Battle.net / Supabase / Sheets values, all optional
pnpm dev
```

## Rollout

1. v2 is developed on `v2`. Every push builds a Vercel preview; production is
   untouched.
2. Before merging, the Vercel project settings must change (the app moves to
   `apps/web`); see [`../guides/deploy.md`](../guides/deploy.md). That change
   and the merge require explicit approval from the owner.
3. Merge `v2` into `main` with a merge commit (no squash, so the history stays
   readable).

## Rollback

- **Before the merge:** nothing to roll back; production never saw v2.
- **After the merge, fast path:** promote the last v1 production deployment in
  Vercel (Instant Rollback).
- **After the merge, in Git:** `git revert -m 1 <merge-commit>` on `main` and
  push. No force-push and no history rewrite; the tag remains the canonical v1
  reference. If the Vercel project settings were changed for v2, revert them too
  (root directory back to the repository root).

## What migrated

See [`inventory.md`](inventory.md) for every v1 item and what happened to it.
