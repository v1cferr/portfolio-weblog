# Publish an article

1. Create `content/weblog/<slug>/<locale>.mdx` (the slug is the URL and the id
   shared by every translation):

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
   ```

2. JavaScript expressions are blocked in MDX; only the components exposed in
   `apps/web/src/features/weblog/mdx.tsx` can be used.
3. Translate by adding another `<locale>.mdx` in the same folder. Without it,
   readers in that locale get the original with a notice.
4. Corrections to a published article: change the text, set `updatedAt`, and
   keep the history in Git. For a change of interpretation, add a dated note
   rather than rewriting the original claim.
5. `pnpm content:check`, then set `status: published`.
