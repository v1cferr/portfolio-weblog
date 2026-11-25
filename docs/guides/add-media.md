# Add photos to an entry

1. Prepare the image from the original, never from an already published copy (it
   rotates it, resizes it to 2400 px at most and removes every bit of metadata,
   including GPS):

   ```sh
   pnpm media:add ~/Pictures/original.jpg career/fai-ufscar/team.jpg
   ```

   The file lands in `apps/web/public/career/fai-ufscar/team.jpg`, and the
   command prints the YAML to paste, with the final width and height.

   The extension picks the encoding. The file is a master that next/image
   re-encodes for each screen, so it should lose as little as possible:

   | Extension       | Encoding                                 | Use it for                          |
   | --------------- | ---------------------------------------- | ----------------------------------- |
   | `.jpg`          | JPEG quality 92, full colour (4:4:4)     | Photos                              |
   | `.png`          | Lossless                                 | Screenshots and documents with text |
   | `.webp`/`.avif` | Lossy, half colour resolution (defaults) | Avoid: the site re-encodes it again |

   Blur what must not be published (ID badges, screens, personal data) on the
   master itself, and check a zoomed crop of each blurred area before
   committing.

2. Reference it in the entry's YAML (experience, project or study):

   ```yaml
   media:
     - src: /career/fai-ufscar/team.jpg
       width: 2400
       height: 1800
       alt: { en-us: What the image shows, pt-br: O que a imagem mostra }
       caption: { en-us: Optional caption }
   ```

3. `pnpm content:check` fails if the file is missing, still has metadata, or has
   a size other than the one in the YAML. The size lets the page reserve the
   space and the lightbox size the full view before the file arrives.

Photos of other people need their consent before they are published.

## Entries without photos

An entry without photos shows no gallery at all: no "photos coming" notice.
Photos are added over time.
