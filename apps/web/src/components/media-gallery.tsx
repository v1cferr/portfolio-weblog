import { localize, type Media } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { Lightbox, LightboxTrigger } from "@/components/lightbox/lightbox";
import { galleryId, type LightboxItem } from "@/components/lightbox/photo-param";

interface MediaGalleryProps {
  /** The entity's id: names the gallery in the lightbox's deep links (`?photo=<id>-<n>`). */
  id: string;
  media: readonly Media[];
  /** Smaller tiles, for cards. */
  compact?: boolean;
}

/**
 * Images attached to an entity. With none, it renders nothing: photos arrive
 * over time, and an entry without them does not announce that.
 */
export async function MediaGallery({ id, media, compact = false }: MediaGalleryProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Media")]);

  if (media.length === 0) return null;

  const items = media.map((item): LightboxItem => {
    const alt = localize(item.alt, locale);
    const caption = item.caption && localize(item.caption, locale);
    return {
      src: item.src,
      width: item.width,
      height: item.height,
      alt: alt.value,
      altLang: alt.locale,
      caption: caption?.value,
      captionLang: caption?.locale,
      ...(item.document === true && { document: true }),
    };
  });

  return (
    <Lightbox id={galleryId(id)} items={items}>
      <ul aria-label={t("label")} className={cn("grid gap-3", compact ? "grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {media.map((item, index) => {
          const alt = localize(item.alt, locale);
          const caption = item.caption && localize(item.caption, locale);
          return (
            <li key={item.src}>
              <figure className="space-y-1.5">
                <LightboxTrigger
                  index={index}
                  className="relative block aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
                  frameClassName="absolute inset-0"
                >
                  <Image
                    src={item.src}
                    alt={alt.value}
                    fill
                    // The real tile widths (measured 2026-11-24): compact tiles are 333 px on a desktop
                    // card and a third of a phone; wide photos cropped into 4:3 need the next size up.
                    sizes={compact ? "(min-width: 1024px) 340px, 30vw" : "(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"}
                    className="object-cover transition-transform hover:scale-[1.02]"
                  />
                </LightboxTrigger>
                {caption && !compact && (
                  <figcaption className="text-sm text-muted-foreground" lang={caption.locale}>
                    {caption.value}
                  </figcaption>
                )}
              </figure>
            </li>
          );
        })}
      </ul>
    </Lightbox>
  );
}
