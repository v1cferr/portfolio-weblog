"use client";

import { ArrowUpRightIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { AnimatePresence, type PanInfo, useDragControls, useIsPresent } from "motion/react";
import * as m from "motion/react-m";
import Image, { getImageProps } from "next/image";
import { useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "radix-ui";
import { type KeyboardEvent, useEffect, useState } from "react";
import { preload } from "react-dom";

import { ExternalLink } from "@/components/external-link";

import type { LightboxItem } from "./photo-param";

export interface LightboxDialogProps {
  items: readonly LightboxItem[];
  /** The open image, or null when closed. */
  index: number | null;
  /** The image the large view grows out of (and back into); null fades instead. */
  morph: number | null;
  layoutId: (index: number) => string;
  onNavigate: (index: number) => void;
  onClose: () => void;
  anchorFor: (index: number) => HTMLAnchorElement | undefined;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const FADE = { duration: 0.2, ease: EASE };
/** The backdrop and the controls fade in and out with the dialog; only the image moves. */
const FADE_IN_OUT = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: FADE } as const;
/** A swipe this far, or this fast, turns the page. */
const SWIPE_OFFSET = 60;
const SWIPE_VELOCITY = 400;

/** The props next/image gives the large view, so a preload asks for exactly the same files. */
/**
 * The full view fills about three quarters of a desktop screen beside the
 * controls, and the whole width of a phone. A document skips the optimizer.
 */
const LARGE_SIZES = "(min-width: 1024px) 80vw, 100vw";

function largeImageProps(item: LightboxItem) {
  return getImageProps({
    src: item.src,
    width: item.width,
    height: item.height,
    alt: "",
    sizes: LARGE_SIZES,
    unoptimized: item.document === true,
  }).props;
}

const control =
  "glass-float inline-flex size-11 shrink-0 items-center justify-center rounded-full text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

/**
 * The open lightbox: a Radix dialog over a frosted backdrop (focus trap, Esc,
 * the page behind made inert), the image as large as the viewport allows, and
 * arrows, swipe and keys to step through the gallery. Loaded on demand by
 * Lightbox (lightbox.tsx).
 */
export function LightboxDialog({ items, index, morph, layoutId, onNavigate, onClose, anchorFor }: LightboxDialogProps) {
  const t = useTranslations("Lightbox");
  const open = index !== null;
  // Keep showing the last image while the dialog animates out.
  const [shown, setShown] = useState(index ?? 0);
  const [direction, setDirection] = useState(0);
  if (index !== null && index !== shown) setShown(index);
  const item = items[shown];
  const count = items.length;

  useEffect(() => {
    if (index === null) return;
    for (const neighbour of [index - 1, index + 1]) {
      const next = items[(neighbour + count) % count];
      if (next === undefined || neighbour === index) continue;
      const props = largeImageProps(next);
      preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: "low" });
    }
  }, [index, items, count]);

  if (item === undefined) return null;

  const step = (delta: number) => {
    if (index === null || count < 2) return;
    setDirection(delta);
    onNavigate((index + delta + count) % count);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowLeft") step(-1);
    else return;
    event.preventDefault();
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay forceMount asChild>
              <m.div className="fixed inset-0 z-50 bg-background/75 backdrop-blur-xl backdrop-saturate-150" {...FADE_IN_OUT} />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              forceMount
              aria-describedby={undefined}
              data-testid="lightbox"
              onKeyDown={onKeyDown}
              onCloseAutoFocus={(event) => {
                // Back to the thumbnail of the image on screen, which may not be the one that opened the dialog.
                event.preventDefault();
                anchorFor(shown)?.focus();
              }}
              className="fixed inset-0 z-50 flex flex-col pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] outline-none"
            >
              {/* The caption names the dialog where there is one (below); otherwise the alt text does, unseen. */}
              {item.caption === undefined && (
                <DialogPrimitive.Title className="sr-only" lang={item.altLang}>
                  {item.alt}
                </DialogPrimitive.Title>
              )}

              <m.div className="flex items-center justify-between gap-2" {...FADE_IN_OUT}>
                {count > 1 ? (
                  <p aria-live="polite" className="glass-float rounded-full px-3 py-1.5 font-mono text-xs text-foreground tabular-nums">
                    <span className="sr-only">{t("position", { index: shown + 1, total: count })}</span>
                    <span aria-hidden data-testid="lightbox-counter">
                      {shown + 1}/{count}
                    </span>
                  </p>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <ExternalLink
                    href={item.src}
                    className="glass-float inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                  >
                    {t("openOriginal")}
                    <ArrowUpRightIcon className="size-4" aria-hidden />
                  </ExternalLink>
                  <DialogPrimitive.Close className={control} aria-label={t("close")}>
                    <XIcon className="size-5" aria-hidden />
                  </DialogPrimitive.Close>
                </div>
              </m.div>

              {/* The stage: a size container, so the frame can fit the image inside it by aspect ratio. */}
              <div
                className="relative my-3 flex min-h-0 flex-1 items-center justify-center [container-type:size]"
                onClick={(event) => {
                  // A click on the empty space around the image closes, as on the backdrop of any dialog.
                  if (event.target === event.currentTarget) onClose();
                }}
              >
                <Frame
                  item={item}
                  index={shown}
                  layoutId={shown === morph ? layoutId(shown) : undefined}
                  direction={direction}
                  draggable={count > 1}
                  placeholderSrc={anchorFor(shown)?.querySelector("img")?.currentSrc ?? ""}
                  onSwipe={step}
                />

                {count > 1 && (
                  <>
                    <m.button
                      {...FADE_IN_OUT}
                      type="button"
                      className={`${control} absolute left-0`}
                      aria-label={t("previous")}
                      onClick={() => {
                        step(-1);
                      }}
                    >
                      <ChevronLeftIcon className="size-5" aria-hidden />
                    </m.button>
                    <m.button
                      {...FADE_IN_OUT}
                      type="button"
                      className={`${control} absolute right-0`}
                      aria-label={t("next")}
                      onClick={() => {
                        step(1);
                      }}
                    >
                      <ChevronRightIcon className="size-5" aria-hidden />
                    </m.button>
                  </>
                )}
              </div>

              {(item.caption !== undefined || item.date !== undefined) && (
                <m.div className="mx-auto max-w-prose space-y-1 text-center text-sm text-pretty text-foreground" {...FADE_IN_OUT}>
                  {item.date !== undefined && (
                    <time dateTime={item.date.iso} className="block font-mono text-xs text-muted-foreground tabular-nums">
                      {item.date.label}
                    </time>
                  )}
                  {item.caption !== undefined && (
                    <DialogPrimitive.Title asChild>
                      <p lang={item.captionLang} data-testid="lightbox-caption">
                        {item.caption}
                      </p>
                    </DialogPrimitive.Title>
                  )}
                </m.div>
              )}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

/** How the frame leaves: sideways when the visitor steps (the direction), or in place when the dialog closes. */
type Exit = number | "close";

/**
 * The image, sized to fit the stage by its aspect ratio. Its own component so
 * it can tell when the dialog is closing (useIsPresent answers for the
 * dialog's AnimatePresence here, not the frame's): it then leaves at once, so
 * the morph runs backwards, the large view shrinking into its thumbnail.
 */
function Frame({
  item,
  index,
  layoutId,
  direction,
  draggable,
  placeholderSrc,
  onSwipe,
}: {
  item: LightboxItem;
  index: number;
  layoutId: string | undefined;
  direction: number;
  draggable: boolean;
  /** The thumbnail's already-downloaded file, shown under the large one until it arrives. */
  placeholderSrc: string;
  onSwipe: (delta: number) => void;
}) {
  const present = useIsPresent();
  const dragControls = useDragControls();
  const exit: Exit = present ? direction : "close";

  const onDragEnd = (_: unknown, { offset, velocity }: PanInfo) => {
    if (offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY) onSwipe(1);
    else if (offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY) onSwipe(-1);
  };

  return (
    <AnimatePresence initial={false} custom={exit} mode="popLayout">
      {present && (
        <m.div
          key={index}
          layoutId={layoutId}
          custom={exit}
          variants={{
            enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
            center: { opacity: 1, x: 0 },
            exit: (how: Exit) => (how === "close" ? { opacity: 0, transition: FADE } : { opacity: 0, x: how * -48 }),
          }}
          initial={layoutId === undefined ? "enter" : false}
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: EASE }}
          drag={draggable ? "x" : false}
          dragListener={false}
          dragControls={dragControls}
          dragSnapToOrigin
          dragElastic={0.5}
          onDragEnd={onDragEnd}
          onPointerDown={(event) => {
            // Started by hand (dragListener off) so Motion leaves touch-action alone and pinch-zoom keeps working.
            if (draggable && event.isPrimary) dragControls.start(event);
          }}
          data-testid="lightbox-frame"
          className="relative touch-pan-y touch-pinch-zoom overflow-hidden rounded-lg bg-muted"
          style={{
            aspectRatio: `${String(item.width)} / ${String(item.height)}`,
            width: `min(100cqw, 100cqh * ${String(item.width / item.height)})`,
            // Never wider than the file: a small source stretched 3× is only a blur.
            maxWidth: `${String(item.width)}px`,
          }}
        >
          {placeholderSrc !== "" && (
            // eslint-disable-next-line @next/next/no-img-element -- the thumbnail's own file, already in the cache; next/image would ask for another size
            <img src={placeholderSrc} alt="" aria-hidden className="absolute inset-0 size-full object-contain" draggable={false} />
          )}
          <Image
            src={item.src}
            width={item.width}
            height={item.height}
            sizes={LARGE_SIZES}
            unoptimized={item.document === true}
            alt={item.alt}
            lang={item.altLang}
            loading="eager"
            draggable={false}
            className="relative size-full object-contain select-none"
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}
