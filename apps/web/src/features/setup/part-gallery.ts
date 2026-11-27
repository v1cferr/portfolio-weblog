import { localize, type Setup } from "@workspace/content";

import type { LightboxItem } from "@/components/lightbox/photo-param";
import type { Locale } from "@/i18n/routing";

/** The lightbox gallery of the setup's part photos: `?photo=setup-parts-<n>`. */
export const PARTS_GALLERY = "setup-parts";

export interface PartGallery {
  items: LightboxItem[];
  /** The gallery index of each part that has a photo, by item id. */
  indexOf: ReadonlyMap<string, number>;
}

/**
 * Every part with a photo, in page order, as one lightbox gallery. A third-party
 * image carries its credit ("Image: Intel"), linked to where its terms are.
 */
export function partLightboxItems(setup: Setup, locale: Locale, creditText: (label: string) => string): PartGallery {
  const items: LightboxItem[] = [];
  const indexOf = new Map<string, number>();
  for (const item of setup.groups.flatMap((group) => group.items)) {
    if (item.media === undefined) continue;
    const alt = localize(item.media.alt, locale);
    const caption = item.media.caption && localize(item.media.caption, locale);
    indexOf.set(item.id, items.length);
    items.push({
      src: item.media.src,
      width: item.media.width,
      height: item.media.height,
      alt: alt.value,
      altLang: alt.locale,
      caption: caption?.value ?? item.model,
      captionLang: caption?.locale,
      ...(item.media.credit && { credit: { text: creditText(item.media.credit.label), url: item.media.credit.url } }),
    });
  }
  return { items, indexOf };
}
