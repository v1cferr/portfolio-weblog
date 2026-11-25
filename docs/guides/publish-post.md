# Publish an article

1. Create `content/weblog/<YYYY>/<MM>/<slug>/<locale>.mdx`. The slug is the URL
   (`/<locale>/weblog/<slug>`) and the id shared by every translation, so it
   must be unique across all folders. `<YYYY>/<MM>` is the month of
   `publishedAt`; a draft without one goes under the month you create it, and
   moves with `git mv` if it is published in another month (`pnpm content:check`
   names the right folder). See
   [ADR 0012](../decisions/0012-dated-content-folders.md).

   ```mdx
   ---
   title: Clear, specific title
   summary: One or two sentences for lists, RSS and search.
   status: draft # draft | review | published
   publishedAt: 2027-01-15 # required when published
   updatedAt: 2027-02-01 # optional
   category: engineering # engineering | infrastructure | ai | career | journal
   tags: [nix, networking]
   projects: [dotfiles]
   experiences: []
   technologies: [nix]
   ---

   Markdown, GFM tables and fenced code. Components:

   <Callout title="...">...</Callout>

   <Figure
     src="/setup/20260723.jpg"
     width="2400"
     height="1800"
     alt="..."
     caption="..."
   />
   ```

2. JavaScript expressions are blocked in MDX; only the components exposed in
   `apps/web/src/features/weblog/mdx.tsx` can be used. Images go under
   `apps/web/public` through `pnpm media:add`, which strips their metadata and
   prints their size; `Figure` takes that size as strings, so the page reserves
   the space and does not shift.
3. Translate by adding another `<locale>.mdx` in the same folder. Without it,
   readers in that locale get the original with a notice.
4. Corrections to a published article: change the text, set `updatedAt`, and
   keep the history in Git. For a change of interpretation, add a dated note
   rather than rewriting the original claim.
5. `pnpm content:check`, then set `status: published`.
