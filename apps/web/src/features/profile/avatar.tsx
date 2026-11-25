import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";
import type { CSSProperties } from "react";

/** The hero photo's size, which the box keeps so nothing shifts while the layers load. */
const PHOTO = { width: 580, height: 780 } as const;

/**
 * The two 1-bit masks from `pnpm avatar:build`: lit pixels for the dark theme,
 * shadow pixels for the light one. URLs go through custom properties so the
 * stylesheet (.avatar-dither in globals.css) picks one per theme.
 */
const MASKS = {
  "--avatar-dither-dark": "url(/images/hero-dither-dark.png)",
  "--avatar-dither-light": "url(/images/hero-dither-light.png)",
} as CSSProperties;

/**
 * The owner's avatar: the hero photo as a 1-bit Atkinson dither painted in
 * the theme's ink. A lens follows the pointer and shows the real photo through
 * it, driven by the Spotlight's --spot-local-x/-y (no script of its own).
 * Tapping or focusing it shows the whole photo, which is also how touch
 * screens and reduced motion see it. Chosen on 2026-11-24 ("P1a · 1-bit
 * Atkinson") from a side-by-side comparison; it replaces the ASCII art.
 *
 * The photo keeps `priority` although it mostly hides: it is painted at
 * opacity 1 from the start, under a lens mask, and Chrome reports it as the
 * page's LCP (masks do not count; measured 2026-11-24). Demoting it, or
 * revealing it only after the Spotlight's script runs, would delay the metric. The masks (about 5 KB each, only the theme's one is
 * fetched) are no LCP candidate, and the stylesheet finds them early enough.
 */
export function Avatar({
  name,
  caption,
  priority = false,
  className,
}: {
  name: string;
  caption?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={cn("group/avatar relative w-80 max-w-full", className)}>
      {/* Focusable so keyboard and touch users can reveal the photo too. */}
      <div
        tabIndex={0}
        data-avatar=""
        data-spotlight-local=""
        className="relative max-w-full overflow-hidden rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ aspectRatio: `${String(PHOTO.width)} / ${String(PHOTO.height)}` }}
      >
        <div aria-hidden data-avatar-dither="" className="avatar-dither absolute inset-0" style={MASKS} />
        <Image
          src="/images/hero.jpg"
          alt={name}
          fill
          sizes="(min-width: 1024px) 24rem, 20rem"
          priority={priority}
          className="avatar-lens object-cover"
        />
      </div>
      {caption !== undefined && <figcaption className="mt-3 border-t pt-2 font-mono text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
