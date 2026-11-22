# Migration from v1 to v2

v2 of the Personal Hub is a rebuild, not an in-place refactor (PWL-97, PWL-98).
The central rule is **migrate knowledge, content and evidence; do not carry
technical debt just because it exists.**

## Where v1 lives

| Reference                                   | Points to               | Purpose                                                                 |
| ------------------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `archive/pre-v2-2026-10-09` (annotated tag) | `c41712c`               | Frozen v1, the last commit deployed from `main` before v2 work started  |
| `archive/v1-final` (annotated tag)          | `2ad1a64`               | The definitive v1: the last `main` tip before v2, with the PR #4 hotfix |
| "v1 final" GitHub Release                   | `archive/v1-final`      | Release notes and the source zip and tar.gz, for download               |
| legacy.v1cferr.dev                          | a deployment of the tag | v1 running, for the owner only (Vercel login); see the deploy guide     |
| `main`                                      | v2 since 2026-11-22     | Production (`v1cferr.dev`)                                              |

Tags follow the same scheme as `v1cferr/dotfiles`: `archive/pre-<change>-<date>`
freezes the state before a rebuild starts, `archive/<era>-final` marks the last
tip of an era when the next one is promoted. Both are annotated and SSH-signed
(`tag.gpgSign` is on globally), and are never moved, recreated or deleted.

`v2` is not an orphan branch, so `git log` on it still shows the full v1
history, and `git blame` across the rebuild works. Unlike in `dotfiles`, the
promotion therefore needs no branch rename: v1 stays in `main`'s ancestry.

`main` is protected by the `history` ruleset (no deletion, no force-push),
declared in
[`.github/rulesets/history.json`](../../.github/rulesets/history.json) and
applied on 2026-10-22. See
[`../guides/repository-settings.md`](../guides/repository-settings.md).

## Running v1 locally

```sh
git switch --detach archive/v1-final
nix develop            # or: direnv allow
pnpm install --frozen-lockfile
cp .env.example .env.local   # Spotify / Battle.net / Supabase / Sheets values, all optional
pnpm dev
```

## Rollout (done on 2026-11-22)

1. v2 was developed on `v2`, previewed at v2.v1cferr.dev behind the Vercel
   login, while production kept serving v1 from `main`.
2. PR #4, the v1 security hotfix (Next.js 16.4.5), was merged into `main`, so
   the final v1 and its legacy site are not vulnerable.
3. `archive/v1-final` was tagged at that `main` tip (signed) and published as
   the "v1 final" GitHub Release.
4. The Vercel project's Root Directory moved to `apps/web`; the root build
   overrides (`vercel.json`, `next` in the root `package.json`) went away.
5. `v2` was merged into `main` with a merge commit (no squash) and pushed, a
   fast-forward the ruleset allows.
6. Afterwards: the `v2.v1cferr.dev` domain and its DNS were removed, the merged
   `v2` branch deleted, the v1-only environment variables (Battle.net, Supabase,
   Google Sheets, `NEXT_PUBLIC_BASE_URL`) removed, and v1 deployed at
   legacy.v1cferr.dev. The temporary `v1` branch planned earlier was not needed:
   the legacy site deploys from the tag.

## Rollback

- **Before the merge:** nothing to roll back; production never saw v2.
- **After the merge, fast path:** promote the last v1 production deployment in
  Vercel (Instant Rollback).
- **After the merge, in Git:** `git revert -m 1 <merge-commit>` on `main` and
  push. No force-push and no history rewrite (the ruleset refuses both);
  `archive/v1-final` remains the canonical v1 reference. Reverting to v1 in
  production also needs the Root Directory back at the repository root and the
  v1 environment variables restored.

## What migrated

See [`inventory.md`](inventory.md) for every v1 item and what happened to it.
