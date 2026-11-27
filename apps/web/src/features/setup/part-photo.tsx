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
  return (
    <LightboxTrigger
      index={index}
      className="relative block size-16 shrink-0 self-start overflow-hidden rounded-lg border bg-muted sm:size-20"
      frameClassName="absolute inset-0"
    >
      <Image
        src={item.media.src}
        alt={alt.value}
        fill
        sizes="80px"
        className="object-contain p-1.5 transition-transform hover:scale-[1.04]"
        data-testid="setup-part-photo"
      />
    </LightboxTrigger>
  );
}
