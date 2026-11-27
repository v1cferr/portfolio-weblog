import { localize, type Setup } from "@workspace/content";
import Image from "next/image";

import { LightboxTrigger } from "@/components/lightbox/lightbox";
import type { Locale } from "@/i18n/routing";

import type { PartGallery } from "./part-gallery";

type SetupItem = Setup["groups"][number]["items"][number];

/**
 * A part's square thumbnail, opening the lightbox. A part without a photo
 * shows nothing here: just its card, no placeholder.
 */
export function PartPhoto({ item, parts, locale }: { item: SetupItem; parts: PartGallery; locale: Locale }) {
  const index = parts.indexOf.get(item.id);
  if (item.media === undefined || index === undefined) return null;
  const alt = localize(item.media.alt, locale);
  // A white product kept on its white background fills a light tile edge to edge; a cut-out floats on the muted one.
  const light = item.media.surface === "light";
  return (
    <LightboxTrigger
      index={index}
      className={`relative block size-16 shrink-0 self-start overflow-hidden rounded-lg border sm:size-20 ${light ? "bg-white" : "bg-muted"}`}
      frameClassName="absolute inset-0"
    >
      <Image
        src={item.media.src}
        alt={alt.value}
        fill
        sizes="80px"
        className={`object-contain transition-transform hover:scale-[1.04] ${light ? "" : "p-1.5"}`}
        data-testid="setup-part-photo"
        data-surface={light ? "light" : undefined}
      />
    </LightboxTrigger>
  );
}
