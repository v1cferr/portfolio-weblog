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

2. Reference it in the entry's YAML (experience, project or study; WoW
   screenshots go in `content/games/wow.yaml`, see [WoW](wow.md#screenshots)):

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

## A photo of the setup over the years

The dated photos under `photos` in `content/profile/setup.yaml` show in two tabs
on `/setup`, each its own timeline and lightbox gallery. Every photo needs a
`kind`:

| Kind       | What it shows                                                   | Deep links                                            |
| ---------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| `hardware` | The desk and its parts                                          | `#setup-photos-hardware`, `?photo=setup-hardware-<n>` |
| `software` | The desktop on screen: a screenshot, or a photo of the monitors | `#setup-photos-software`, `?photo=setup-software-<n>` |

A camera photo whose subject is the system on screen (an OS, a window manager, a
VM) is `software`, even though the monitors show in it.

## A photo of a setup part

Each part on `/setup` can have one photo: a square thumbnail on its card that
opens the lightbox (`?photo=setup-parts-<n>`). A part without one shows just its
card.

1. Drop the original in `docs/tmp/files/setup-parts/<item-id>.<ext>` (the item's
   `id` in `content/profile/setup.yaml`). Claude crops it square around the
   part, blurs serial numbers and anything personal, and runs:

   ```sh
   pnpm media:add docs/tmp/files/setup-parts/mouse-razer-deathadder-v2.jpg setup/parts/mouse-razer-deathadder-v2.jpg
   ```

2. Add it to the item:

   ```yaml
   - id: mouse-razer-deathadder-v2
     # ...
     media:
       src: /setup/parts/mouse-razer-deathadder-v2.jpg
       width: 1600
       height: 1600
       alt: { en-us: What the photo shows, pt-br: O que a foto mostra }
   ```

The current parts show the manufacturer's official product image (the owner's
call, 2026-11-27), taken from the manufacturer's own product page or CDN, never
from a review or anyone else's photo. Only when the manufacturer publishes no
image of that model does it come from the store listing the part links to,
preferably the brand's own official store on a marketplace (Snowdog on Mercado
Livre, Baseus on AliExpress). When the page is gone, an archived copy on the
Wayback Machine is the link. Each one has a `credit`: the manufacturer's name as
`label` and the page the image came from as `url`, shown under the photo in the
lightbox. Images with a plain white background get it cut to transparency
(ImageMagick flood fill from the corners, then trimmed and centred on a square);
a white product on white keeps its background. The owner's own photo replaces
the official one whenever there is one (drop the `credit`). Old desk photos from
the setup history are never cropped into part photos.
