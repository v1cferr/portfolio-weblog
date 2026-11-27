"use client";

import { Collapsible } from "@workspace/ui/components/collapsible";
import type { ComponentProps } from "react";

import { usePageSessionState } from "@/hooks/use-session-state";

/*
 * Disclosures that stay as the reader left them for the tab: across a reload
 * and a language switch, never into the next visit (docs/guides/ui-state.md).
 * Server components use these in place of a bare Collapsible or <details>;
 * `stateId` names the element on its page and must not depend on the language.
 */

type SessionCollapsibleProps = Omit<ComponentProps<typeof Collapsible>, "open" | "onOpenChange" | "defaultOpen"> & {
  stateId: string;
  defaultOpen?: boolean;
};

/** shadcn's Collapsible, its open state kept per tab. */
export function SessionCollapsible({ stateId, defaultOpen = false, ...props }: SessionCollapsibleProps) {
  const [open, setOpen] = usePageSessionState(`collapsible:${stateId}`, defaultOpen);
  return <Collapsible {...props} open={open} onOpenChange={setOpen} />;
}

type SessionDetailsProps = Omit<ComponentProps<"details">, "open" | "onToggle"> & {
  stateId: string;
  defaultOpen?: boolean;
};

/**
 * A native <details>, its open state kept per tab. The browser still toggles
 * it (a click on the summary, find-in-page, a deep link opening it); the
 * toggle event just records the result.
 */
export function SessionDetails({ stateId, defaultOpen = false, ...props }: SessionDetailsProps) {
  const [open, setOpen] = usePageSessionState(`details:${stateId}`, defaultOpen);
  return (
    <details
      {...props}
      open={open}
      onToggle={(event) => {
        if (event.currentTarget.open !== open) setOpen(event.currentTarget.open);
      }}
    />
  );
}
