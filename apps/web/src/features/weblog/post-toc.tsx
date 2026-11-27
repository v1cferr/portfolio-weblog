"use client";

import { CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDownIcon, ListIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { SessionCollapsible } from "@/components/session-disclosure";

import type { TocEntry } from "./mdx";

function TocList({ entries, active }: { entries: TocEntry[]; active?: string | undefined }) {
  return (
    <ol className="space-y-1 text-sm">
      {entries.map((entry) => (
        <li key={entry.id} className={entry.depth === 3 ? "pl-3" : undefined}>
          <a
            href={`#${entry.id}`}
            aria-current={entry.id === active ? "location" : undefined}
            className={cn(
              "-ml-px block border-l-2 border-transparent py-1 pl-3 text-pretty text-muted-foreground transition-colors hover:text-foreground",
              "aria-[current=location]:border-lane-writing aria-[current=location]:font-medium aria-[current=location]:text-foreground"
            )}
          >
            {entry.text}
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * The heading the reader is in: the last one whose top has passed the line
 * just under the sticky header. An IntersectionObserver wakes the check when a
 * heading crosses the viewport, so nothing runs on every scroll frame.
 */
function useActiveHeading(ids: string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(undefined);
  useEffect(() => {
    const headings = ids.flatMap((id) => {
      const element = document.getElementById(id);
      return element === null ? [] : [element];
    });
    if (headings.length === 0) return;
    // A jump parks the heading at the scroll padding; the slack covers the heading's own margin.
    const line = () => (Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80) + 32;
    const update = () => {
      const limit = line();
      let current: string | undefined;
      for (const heading of headings) if (heading.getBoundingClientRect().top <= limit) current = heading.id;
      // At the very end the last short sections can never reach the line: the last heading in view wins.
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atEnd) current = headings.findLast((heading) => heading.getBoundingClientRect().top < window.innerHeight)?.id ?? current;
      setActive(current);
    };
    const observer = new IntersectionObserver(update, { rootMargin: "0px 0px -40% 0px", threshold: [0, 1] });
    for (const heading of headings) observer.observe(heading);
    // A jump (a link, the back button) can land between two headings without one crossing.
    window.addEventListener("hashchange", update);
    window.addEventListener("scrollend", update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", update);
      window.removeEventListener("scrollend", update);
    };
  }, [ids]);
  return active;
}

/** Desktop: sticky in the gutter beside the text, marking the current section. */
export function PostTocAside({ entries, label }: { entries: TocEntry[]; label: string }) {
  const [ids] = useState(() => entries.map((entry) => entry.id));
  const active = useActiveHeading(ids);
  return (
    <nav aria-label={label} data-testid="post-toc" className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto">
      <p className="mb-3 font-mono text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="border-l">
        <TocList entries={entries} active={active} />
      </div>
    </nav>
  );
}

/** Phones and tablets: a disclosure at the top of the article, closed by default, kept per tab. */
export function PostTocDisclosure({ entries, label, stateId }: { entries: TocEntry[]; label: string; stateId: string }) {
  return (
    <nav aria-label={label} data-testid="post-toc-mobile" className="mb-8 rounded-xl border lg:hidden">
      <SessionCollapsible stateId={stateId} className="group/toc">
        <CollapsibleTrigger className="flex min-h-11 w-full items-center gap-2 px-4 text-sm font-medium">
          <ListIcon aria-hidden className="size-4 text-lane-writing" />
          {label}
          <ChevronDownIcon aria-hidden className="ml-auto size-4 transition-transform group-data-[state=open]/toc:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t px-4 py-3">
          <div className="border-l">
            <TocList entries={entries} />
          </div>
        </CollapsibleContent>
      </SessionCollapsible>
    </nav>
  );
}
