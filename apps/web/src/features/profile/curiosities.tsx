import { localize, type Profile } from "@workspace/content";
import { ArrowRightIcon, LightbulbIcon } from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { CopyLink } from "@/components/anchor/copy-link";
import { Lightbox, LightboxTrigger } from "@/components/lightbox/lightbox";
import { galleryId, type LightboxItem } from "@/components/lightbox/photo-param";
import { SectionHeading } from "@/components/page-header";
import { Link } from "@/i18n/navigation";
import { SHOWS_REVIEW } from "@/lib/preview";
import { getTattoos } from "@/lib/tattoos";

/** A curiosity shows when published, or in review on a preview deployment (ADR 0019). */
const shown = (status: string) => status === "published" || (SHOWS_REVIEW && status === "review");

/** The href, unless it points at a page that is hidden right now (the tattoos page before it is published). */
function visibleHref(href: string | undefined): string | undefined {
  if (href === undefined) return undefined;
  return isTattooStory(href) && getTattoos() === undefined ? undefined : href;
}

/** A tattoo's photo opens its story on the tattoos page, which has the full-size photo, instead of the lightbox. */
const isTattooStory = (href: string | undefined): href is string => href !== undefined && /^\/tattoos(?:[#?]|$)/.test(href);

/**
 * The end of the About page: personal facts in the owner's words. A photo opens
 * in the lightbox (`?photo=curiosities-<n>`), and a link points at the page on
 * this site that tells more, down to the element (`/setup#<item>`). Each card
 * is a deep link itself: `/about#curiosity-<id>`.
 */
export async function Curiosities({ items: all }: { items: Profile["curiosities"] }) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("About")]);
  const items = all.filter((item) => shown(item.status)).map((item) => ({ ...item, href: visibleHref(item.href) }));
  if (items.length === 0) return null;

  const photos = items.flatMap((item) => (item.media === undefined || isTattooStory(item.href) ? [] : [item.media]));
  const lightboxItems = photos.map((media): LightboxItem => {
    const alt = localize(media.alt, locale);
    const caption = media.caption && localize(media.caption, locale);
    return {
      src: media.src,
      width: media.width,
      height: media.height,
      alt: alt.value,
      altLang: alt.locale,
      caption: caption?.value,
      captionLang: caption?.locale,
    };
  });

  return (
    <section aria-labelledby="curiosities" className="mt-16 max-w-4xl" data-testid="curiosities">
      <SectionHeading id="curiosities" icon={LightbulbIcon}>
        {t("curiosities")}
      </SectionHeading>
      <Lightbox id={galleryId("curiosities")} items={lightboxItems}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const text = localize(item.text, locale);
            const photoIndex = item.media === undefined ? -1 : photos.indexOf(item.media);
            const alt = item.media && localize(item.media.alt, locale);
            return (
              <li
                key={item.id}
                id={`curiosity-${item.id}`}
                data-anchor=""
                className={`group/anchor glass relative flex flex-col overflow-hidden rounded-xl border ${item.media === undefined ? "" : "sm:col-span-2 sm:flex-row"}`}
              >
                {item.media !== undefined &&
                  alt !== undefined &&
                  (isTattooStory(item.href) ? (
                    <Link
                      href={item.href}
                      className="relative block aspect-[4/5] shrink-0 overflow-hidden border-b bg-muted sm:w-56 sm:border-r sm:border-b-0"
                    >
                      <Image
                        src={item.media.src}
                        alt={alt.value}
                        fill
                        sizes="(min-width: 640px) 224px, 100vw"
                        className="object-cover transition-transform hover:scale-[1.02]"
                      />
                    </Link>
                  ) : (
                    <LightboxTrigger
                      index={photoIndex}
                      className="relative block aspect-[4/5] shrink-0 overflow-hidden border-b bg-muted sm:w-56 sm:border-r sm:border-b-0"
                      frameClassName="absolute inset-0"
                    >
                      <Image
                        src={item.media.src}
                        alt={alt.value}
                        fill
                        sizes="(min-width: 640px) 224px, 100vw"
                        className="object-cover transition-transform hover:scale-[1.02]"
                      />
                    </LightboxTrigger>
                  ))}
                <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
                  <div className="flex items-start gap-1">
                    <p id={`curiosity-${item.id}-text`} lang={text.locale} className="flex-1">
                      {text.value}
                    </p>
                    <CopyLink id={`curiosity-${item.id}`} nameId={`curiosity-${item.id}-text`} className="-mr-1" />
                  </div>
                  {item.href !== undefined && (
                    <Link
                      href={item.href}
                      aria-describedby={`curiosity-${item.id}-text`}
                      className="group/link mt-auto inline-flex min-h-11 items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground"
                    >
                      {t("curiositiesMore")}
                      <ArrowRightIcon className="icon-fwd size-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Lightbox>
    </section>
  );
}
