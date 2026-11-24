# Add photos to an entry

1. Prepare the image (rotates it, resizes it to 1600 px at most and removes
   every bit of metadata, including GPS):

   ```sh
   pnpm media:add ~/Pictures/original.jpg career/fai-ufscar/team.webp
   ```

   The file lands in `apps/web/public/career/fai-ufscar/team.webp`, and the
   command prints the YAML to paste, with the final width and height.

2. Reference it in the entry's YAML (experience, project or study):

   ```yaml
   media:
     - src: /career/fai-ufscar/team.webp
       width: 1600
       height: 1200
       alt: { en-us: What the image shows, pt-br: O que a imagem mostra }
       caption: { en-us: Optional caption }
   ```

3. `pnpm content:check` fails if the file is missing, still has metadata, or has
   a size other than the one in the YAML. The size lets the page reserve the
   space and the lightbox size the full view before the file arrives.

Photos of other people need their consent before they are published.

## The placeholder

Entries without photos show a reserved "photos coming" space. Switch it off for
the whole site in `apps/web/src/config/site.ts` (`mediaPlaceholders: false`), or
for one entry with `mediaPlaceholder: false` in its file.
