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
