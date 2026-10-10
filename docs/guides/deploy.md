# Deploy and preview

## Today (v2 on its own branch)

- Every push to `v2` builds a Vercel **preview** of the existing project
  (`portfolio-weblog-git-v2-v1cferr.vercel.app`, behind Vercel deployment
  protection).
- Production (`v1cferr.dev`) keeps deploying `main`, which is still v1.
- The Vercel project's Root Directory is the repository root and is shared by
  every branch, so v2 builds from the root: `vercel.json` runs `pnpm build` and
  reads `apps/web/.next`, and the root `package.json` declares `next` so Vercel
  can detect the framework.

## Switching production to v2 (needs the owner's approval)

1. Review `docs/migration/editorial-review.md` and resolve what should be
   public.
2. In Vercel → Project → Settings → Build and Deployment, set Root Directory to
   `apps/web` and enable "Include files outside the root directory".
3. Remove `next` from the root `package.json` and the build overrides from
   `vercel.json` in the same pull request.
4. Optionally add `GITHUB_TOKEN` (read-only, no scopes) to the Production
   environment.
5. Merge `v2` into `main` with a merge commit. Rollback options are in
   [`../migration/README.md`](../migration/README.md).

Remove the v1-only environment variables (Spotify, Battle.net, Supabase, Google
Sheets) once production runs v2.
