import { atkinsonDither } from "@workspace/content";
import sharp from "sharp";

import { COVER_ID } from "@/lib/now-playing";

const SIZE = 96;

/**
 * An album cover as a 1-bit Atkinson dither, like the avatar: opaque pixels
 * on a transparent ground, which the page paints in the text colour with CSS
 * mask-image. `?tone=dark` (light ink on a dark page) inks the cover's light
 * parts; `?tone=light` inks its dark parts, as the avatar's two files do. Only Spotify image hashes are accepted, so this can never
 * be used to fetch an arbitrary URL; a hash never changes, so the result is
 * cached for a year.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!COVER_ID.test(id)) return new Response("Not found", { status: 404 });
  const inkLight = new URL(request.url).searchParams.get("tone") !== "light";

  const source = await fetch(`https://i.scdn.co/image/${id}`, { cache: "no-store" });
  if (!source.ok) return new Response("Not found", { status: 404 });

  const gray = await sharp(Buffer.from(await source.arrayBuffer()))
    .resize(SIZE, SIZE, { fit: "cover" })
    .grayscale()
    .normalise({ lower: 2, upper: 98 })
    .raw()
    .toBuffer();
  const bits = atkinsonDither(gray, SIZE, SIZE);

  const pixels = Buffer.alloc(SIZE * SIZE * 4, 255);
  for (let i = 0; i < SIZE * SIZE; i++) pixels[i * 4 + 3] = (bits[i] === 1) === inkLight ? 255 : 0;
  const png = await sharp(pixels, { raw: { width: SIZE, height: SIZE, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
