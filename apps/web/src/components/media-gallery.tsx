import { localize, type Media } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";

interface MediaGalleryProps {
  media: readonly Media[];
  /** The entity's own opt-out (`mediaPlaceholder` in content). */
  placeholder: boolean;
  /** Smaller tiles, for cards. */
  compact?: boolean;
}

/**
 * Images attached to an entity. With none, it shows a reserved space while the
 * site-wide switch and the entity both allow it, and nothing otherwise.
 */
export async function MediaGallery({ media, placeholder, compact = false }: MediaGalleryProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Media")]);

  if (media.length === 0) {
    if (!siteConfig.mediaPlaceholders || !placeholder) return null;
    return (
      <div
        data-testid="media-placeholder"
        className={cn(
          "flex items-center gap-3 rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground",
          compact ? "px-3 py-2.5" : "px-4 py-6"
        )}
      >
        <ImageIcon className="size-5 shrink-0" aria-hidden />
        <span>{t("placeholder")}</span>
      </div>
    );
  }

  return (
    <ul aria-label={t("label")} className={cn("grid gap-3", compact ? "grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
      {media.map((item) => {
        const alt = localize(item.alt, locale);
        const caption = item.caption && localize(item.caption, locale);
        return (
          <li key={item.src}>
            <figure className="space-y-1.5">
              <a href={item.src} className="relative block aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={item.src}
                  alt={alt.value}
                  fill
                  sizes={compact ? "160px" : "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"}
                  className="object-cover transition-transform hover:scale-[1.02]"
                />
              </a>
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
  );
}
