# Deploy and preview

## Production

- `main` deploys to **[v1cferr.dev](https://v1cferr.dev)** through the Vercel
  project `portfolio-weblog`. v2 has served production since 2026-11-22.
- The project's Root Directory is `apps/web`, with "Include files outside the
  root directory" on, so the app sees the workspace packages and `content/`.
  Vercel detects Next.js and pnpm from there; there is no `vercel.json`.
- Every other branch and every pull request gets a preview deployment, behind
  Vercel deployment protection, so only someone logged in to the Vercel team
  sees it. `robots.txt` disallows indexing on previews.
- Environment variables (all server-only): `SPOTIFY_CLIENT_ID`,
  `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` (rotate with
  `pnpm --filter web spotify:token --vercel`) and, optionally, `GITHUB_TOKEN`
  (read-only, no scopes).
- DNS for `v1cferr.dev` is on Cloudflare.

## Legacy (v1)

- **[legacy.v1cferr.dev](https://legacy.v1cferr.dev)** serves v1, frozen at
  `archive/v1-final`, for the owner to look back at. It is a separate Vercel
  project, `portfolio-weblog-legacy`, with no Git connection: one production
  deployment made from the tag with the Vercel CLI. The project's deployment
  protection is set to "All Deployments", so the custom domain and the
  `.vercel.app` URL both redirect to the Vercel login. v1 contains personal data
  that v2 left out (phone number, birth date, geotagged photos), so it must stay
  behind the login: never lower that setting.
- It has no environment variables: v1's integrations (Spotify, Battle.net,
  Supabase, Google Sheets) are optional and render empty.
- To redeploy it (only if the project is ever lost), first recreate the project
  with protection on "All Deployments", then:

  ```sh
  git worktree add /tmp/v1 archive/v1-final && cd /tmp/v1
  nix develop -c pnpm install --frozen-lockfile
  nix develop -c pnpm exec vercel link --project portfolio-weblog-legacy
  nix develop -c pnpm exec vercel deploy --prod
  ```

  Then add `legacy.v1cferr.dev` to the project and check, logged out, that it
  redirects to the login.

- On the owner's LAN, `legacy` needs a router DNS exception like every public
  subdomain (dotfiles `hosts/cudy-wr3000/uci/dhcp.conf`).
