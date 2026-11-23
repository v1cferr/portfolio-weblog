import type { AsciiRow } from "@workspace/content";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

import { avatarAscii } from "@/generated/avatar-ascii";

/** SVG units per glyph cell: 6 wide, 10 tall (the 0.6 aspect the grid was sampled at). */
const CELL = { width: 6, height: 10 } as const;

/**
 * The owner's avatar: the hero photo as ASCII in the theme's ink, with colour
 * only where the photo is vivid (the lanyard). A lens follows
 * the pointer and shows the real photo through it, driven by the Spotlight's
 * --spot-local-x/-y (no script of its own). Tapping or focusing it shows the
 * whole photo, which is also how touch screens and reduced motion see it.
 * Built by `pnpm avatar:build`; chosen in a side-by-side comparison on
 * 2026-11-22.
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
  const { columns, rows, photo } = avatarAscii;
  return (
    <figure className={cn("group/avatar relative w-80 max-w-full", className)}>
      {/* Focusable so keyboard and touch users can reveal the photo too. */}
      <div
        tabIndex={0}
        data-avatar=""
        data-spotlight-local=""
        className="relative max-w-full overflow-hidden rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ aspectRatio: `${String(photo.width)} / ${String(photo.height)}` }}
      >
        <AsciiArt grid={avatarAscii.light} columns={columns} rows={rows} className="text-foreground/85 dark:hidden" />
        <AsciiArt grid={avatarAscii.dark} columns={columns} rows={rows} className="hidden text-foreground/85 dark:block" />
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

function AsciiArt({ grid, columns, rows, className }: { grid: AsciiRow[]; columns: number; rows: number; className?: string }) {
  const width = columns * CELL.width;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${String(width)} ${String(rows * CELL.height)}`}
      preserveAspectRatio="none"
      className={cn("absolute inset-0 size-full font-mono [white-space:pre]", className)}
      fill="currentColor"
      fontSize={CELL.height}
    >
      {grid.map((row, y) => (
        // textLength pins every row to the full width, whatever the font's advance.
        <text key={y} x={0} y={(y + 0.82) * CELL.height} textLength={width} lengthAdjust="spacingAndGlyphs">
          {row.map((segment, i) =>
            segment.color === undefined ? (
              segment.text
            ) : (
              <tspan key={i} fill={segment.color}>
                {segment.text}
              </tspan>
            )
          )}
        </text>
      ))}
    </svg>
  );
}
