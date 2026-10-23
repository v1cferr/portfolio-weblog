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
| `archive/v1-final` (annotated tag, future)  | the last `main` tip before the switch   | Created on promotion day; the definitive v1 reference                  |
| `v1` (branch, future, temporary)            | same commit as `archive/v1-final`       | Kept for lookups while v2 settles, then deleted; the tag stays         |

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
git switch --detach archive/pre-v2-2026-10-09
nix develop            # or: direnv allow
pnpm install --frozen-lockfile
cp .env.example .env.local   # Spotify / Battle.net / Supabase / Sheets values, all optional
pnpm dev
```

## Rollout

1. v2 is developed on `v2`. Every push builds a Vercel preview, always reachable
   at [v2.v1cferr.dev](https://v2.v1cferr.dev) (behind Vercel login); production
   is untouched.
2. Before merging, the Vercel project settings must change (the app moves to
   `apps/web`); see [`../guides/deploy.md`](../guides/deploy.md). That change
   and the promotion require explicit approval from the owner.
3. Promotion day, in this order:

   ```sh
   git switch main && git pull --ff-only
   # the definitive v1 reference, signed like every archive tag
   git tag -a archive/v1-final -m "Final v1 tree: the last main tip before v2 was promoted to main"
   git branch v1 archive/v1-final
   git push origin archive/v1-final v1
   # v2 into main with a merge commit (no squash), then push: a fast-forward, allowed by the ruleset
   git merge --no-ff v2 -m "Merge v2: content-first rebuild of the Personal Hub"
   git push origin main
   ```

4. After the merge: drop `v2` from the CI triggers, remove the `v2.v1cferr.dev`
   branch domain or point it elsewhere, and delete the `v1` branch once nothing
   needs it (the tag keeps the tree forever).

## Rollback

- **Before the merge:** nothing to roll back; production never saw v2.
- **After the merge, fast path:** promote the last v1 production deployment in
  Vercel (Instant Rollback).
- **After the merge, in Git:** `git revert -m 1 <merge-commit>` on `main` and
  push. No force-push and no history rewrite (the ruleset refuses both);
  `archive/v1-final` remains the canonical v1 reference. If the Vercel project
  settings were changed for v2, revert them too (root directory back to the
  repository root).

## What migrated

See [`inventory.md`](inventory.md) for every v1 item and what happened to it.
