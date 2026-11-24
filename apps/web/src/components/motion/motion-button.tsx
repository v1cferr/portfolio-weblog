"use client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import * as m from "motion/react-m";
import type { ComponentProps } from "react";

const press = { scale: 0.95 };

/**
 * A shadcn Button rendered as m.button, for the controls with a state icon
 * (see state-icons.tsx). It presses with Motion (whileTap; the CSS press scale
 * skips it through data-press="motion") and hands "rest"/"hover" variants to
 * its icons: hover on pointer devices only, focus from the keyboard only.
 * Motion moves the transform, so the button's CSS transition leaves it alone.
 */
export function MotionButton({ children, className, type = "button", ...props }: ComponentProps<typeof Button>) {
  return (
    <Button asChild className={cn("transition-[color,background-color,border-color,box-shadow,opacity]", className)} {...props}>
      <m.button type={type} data-press="motion" initial={false} animate="rest" whileHover="hover" whileFocus="hover" whileTap={press}>
        {children}
      </m.button>
    </Button>
  );
}
