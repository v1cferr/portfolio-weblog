import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

/**
 * The owner's avatar: a 1-bit dither in the theme's ink, like a print or a
 * terminal, that crossfades to the real photo (cut out, on glass) on hover or
 * keyboard focus. Built by `pnpm avatar:build` from the photo and its mask;
 * chosen in a bake-off on 2026-10-23. A CSS transition, so no JavaScript, and
 * none at all with reduced motion.
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
    <figure className={cn("group/avatar relative w-72 max-w-full", className)}>
      {/* Focusable so keyboard users can reveal the photo too. */}
      <div tabIndex={0} className="relative aspect-square rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Image
          src="/images/avatar-dither-light.png"
          alt={name}
          fill
          sizes="288px"
          priority={priority}
          unoptimized
          className="object-contain [image-rendering:pixelated] dark:hidden"
        />
        <Image
          src="/images/avatar-dither-dark.png"
          alt={name}
          fill
          sizes="288px"
          priority={priority}
          unoptimized
          className="hidden object-contain [image-rendering:pixelated] dark:block"
        />
        <div
          aria-hidden
          className="glass absolute inset-0 overflow-hidden rounded-[28px] border opacity-0 transition-opacity duration-500 group-hover/avatar:opacity-100 group-focus-within/avatar:opacity-100 motion-reduce:transition-none"
        >
          <div className="absolute inset-[-20%] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--lane-project)_35%,transparent),transparent)]" />
          <Image src="/images/avatar-cutout.webp" alt="" fill sizes="288px" className="object-contain object-bottom" />
        </div>
      </div>
      {caption !== undefined && <figcaption className="mt-3 border-t pt-2 font-mono text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
