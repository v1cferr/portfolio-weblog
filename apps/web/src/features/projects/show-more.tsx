"use client";

import { Button } from "@workspace/ui/components/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";

import { usePageSessionState } from "@/hooks/use-session-state";

/**
 * Folds the tail of a long list behind a button. The folded rows stay in the
 * HTML (forceMount + hidden), so crawlers and no-script readers still get them.
 * Unfolded stays unfolded for the tab, across reloads and languages
 * (docs/guides/ui-state.md); `stateId` names it on the page.
 */
export function ShowMore({ stateId, more, less, children }: { stateId: string; more: string; less: string; children: ReactNode }) {
  const [open, setOpen] = usePageSessionState(`show-more:${stateId}`, false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleContent forceMount hidden={!open}>
        {children}
      </CollapsibleContent>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-3 font-mono text-muted-foreground">
          <ChevronDownIcon aria-hidden className={open ? "rotate-180 transition-transform" : "transition-transform"} />
          {open ? less : more}
        </Button>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
