"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@workspace/ui/components/drawer";
import { cn } from "@workspace/ui/lib/utils";
import type { ReactNode, RefObject } from "react";

/**
 * The dock on phones: a modal bottom sheet (vaul). A module of its own so vaul
 * is downloaded with the first open on a phone, not by every page (AskDock
 * loads it with next/dynamic).
 */
export default function AskSheet({
  open,
  title,
  panel,
  launcher,
  onClose,
  focusInput,
  header,
  children,
}: {
  open: boolean;
  title: string;
  panel: RefObject<HTMLDivElement | null>;
  launcher: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  focusInput: () => void;
  /** The dock's title bar, given the sheet's own accessible title. */
  header: (title: ReactNode) => ReactNode;
  children: ReactNode;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      // The keyboard is handled by the dock (useKeyboardInset), not by vaul's own repositioning.
      repositionInputs={false}
    >
      <DrawerContent
        ref={panel}
        id="ask-dock"
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focusInput();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          launcher.current?.focus({ preventScroll: true });
        }}
        className={cn(
          // Opaque: over a modal backdrop, page text showing through a frosted sheet only competes with the answer.
          "overflow-clip border-0 bg-background text-foreground shadow-2xl outline-none",
          // Near full height: below the notch (or a small gap), above the keyboard, clear of the home indicator.
          "bottom-[var(--ask-keyboard,0px)]! mt-0! h-[calc(100dvh_-_var(--ask-keyboard,0px)_-_max(env(safe-area-inset-top),0.75rem))] max-h-none! rounded-t-2xl",
          "pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]"
        )}
      >
        {header(<DrawerTitle className="ml-1 min-w-0 truncate text-sm font-medium">{title}</DrawerTitle>)}
        {children}
      </DrawerContent>
    </Drawer>
  );
}
