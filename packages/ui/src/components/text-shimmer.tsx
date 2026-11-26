"use client";

import { cn } from "cn";

/*
 * TextShimmer, from prompt-kit (https://www.prompt-kit.com, MIT), added with
 * `shadcn add https://www.prompt-kit.com/c/text-shimmer.json`. Pure CSS, no
 * Motion. Adapted: the gradient and its animation live in the `.text-shimmer`
 * class (globals.css), which only applies without a reduced-motion
 * preference; with one, the text is plain, in the color it inherits.
 */

export type TextShimmerProps = {
  as?: string;
  /** Seconds per sweep. */
  duration?: number;
  /** Width of the bright band, in percent of the text (5 to 45). */
  spread?: number;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export function TextShimmer({ as = "span", className, duration = 4, spread = 20, children, style, ...props }: TextShimmerProps) {
  const dynamicSpread = Math.min(Math.max(spread, 5), 45);
  const Component = as as React.ElementType;

  return (
    <Component
      data-slot="text-shimmer"
      className={cn("text-shimmer font-medium", className)}
      style={
        {
          "--shimmer-from": `${String(50 - dynamicSpread)}%`,
          "--shimmer-to": `${String(50 + dynamicSpread)}%`,
          "--shimmer-duration": `${String(duration)}s`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </Component>
  );
}
