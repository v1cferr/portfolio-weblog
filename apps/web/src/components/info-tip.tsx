"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";

/** How long the pointer may travel between the button and the card before it closes. */
const HOVER_GRACE_MS = 150;

/**
 * Helper text behind an "i" (a toggletip): the page stays clean and the
 * explanation is one gesture away. A tap, click, Enter or Space opens it and
 * keeps it open; on devices with a real pointer, hovering the button opens it
 * too, and the card stays open while the pointer is on it (WCAG 1.4.13). Esc,
 * a tap outside or a second click closes it.
 *
 * Only for text nobody needs to read to use the page: errors, status and
 * warnings stay visible.
 */
export function InfoTip({
  children,
  label,
  className,
  side = "bottom",
  align = "center",
}: {
  children: ReactNode;
  /** The button's accessible name; defaults to "More information". */
  label?: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}) {
  const t = useTranslations("Common");
  const [open, setOpen] = useState(false);
  // Opened by a click or key: hover leaving must not close it.
  const pinned = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    []
  );

  const hoverOpen = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    setOpen(true);
  };
  const hoverClose = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse" || pinned.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOpen(false);
    }, HOVER_GRACE_MS);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) pinned.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger
        type="button"
        aria-label={label ?? t("moreInfo")}
        data-info-tip=""
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onClick={(event) => {
          // Radix toggles on click; a click after a hover-open pins it instead of closing it.
          if (open && !pinned.current) {
            event.preventDefault();
            pinned.current = true;
            return;
          }
          pinned.current = !open;
        }}
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-full align-middle text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground data-[state=open]:text-foreground",
          // A 24px target with a larger invisible hit area for touch.
          "relative after:absolute after:-inset-2 after:content-['']",
          className
        )}
      >
        <InfoIcon aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        data-info-tip-content=""
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        // Opening on hover must not steal focus from where the reader is.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        className="w-auto max-w-72 px-3 py-2.5 text-sm leading-relaxed text-pretty text-muted-foreground"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
