# Add a professional experience

1. Add the organization to `content/taxonomies/organizations.yaml` if it is new
   (logo, if any, in `apps/web/public/company-logos/`).
2. Create `content/experiences/<organization>-<start year>.yaml`:

   ```yaml
   id: acme-2027
   status: review # publish only when every fact is confirmed
   organization: acme
   positions:
     - title: { en-us: Software engineer, pt-br: Engenheiro de software }
       start: 2027-02 # only the precision you know
   summary:
     en-us: One sentence about the role.
   responsibilities: { en-us: [...] }
   contributions: { en-us: [...] }
   learnings: { en-us: [...] }
   technologies: [python, fastapi]
   projects: []
   evidence: [] # public links that support the claims
   ```

3. A new position at the same organization (e.g. a promotion) is a new
   `positions` entry, not a new file.
4. Numbers you cannot back with evidence go to `pendingReview`, not to
   `contributions`.
5. Run `pnpm content:check`, then switch `status` to `published`.

## Add a long-form story (optional)

A job can have a story: a longer, first-person text read after its page, at
`/<locale>/career/<id>/story`. The job page links to it ("Read the full story")
only while a published translation exists.

1. Create `content/experiences/<id>/story.<locale>.mdx`, one file per locale.
   The folder is named after the experience id and sits next to `<id>.yaml`:

   ```mdx
   ---
   title: What the job was about
   summary: One or two sentences for the page header and search results.
   status: review # draft, review or published
   updatedAt: 2027-03-01 # last revision of the text
   ---

   ## The problem
   ```

2. Write only what the experience file, a public source or the Git history
   supports, and cite public sources in a `## Sources` section at the end. Notes
   for the reviewer go in MDX comments, `{/* OWNER: ... */}`; they never reach
   the page. Prettier skips these files because it mangles those comments.
3. A story follows its job across the public boundary: it is shown only when it
   is `published` and `public` and the experience is too. Translations must
   agree on `visibility`, and a locale without a translation shows the English
   one with a notice.
4. Run `pnpm content:check`; it counts stories and rejects a folder with no
   matching experience or a file not named `story.<locale>.mdx`.
