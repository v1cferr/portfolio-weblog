"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { Spinner } from "@workspace/ui/components/spinner";
import { TextShimmer } from "@workspace/ui/components/text-shimmer";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";

import { useDelayed } from "@/hooks/use-delayed";

import type { Turn } from "./turn";

/** The elapsed time shows only once the wait is long enough to wonder about. */
const ELAPSED_FROM_MS = 3000;

type Page = { title: string; url: string };

/** Whole seconds, at least 1, for "14 s". */
const toSeconds = (ms: number) => Math.max(1, Math.round(ms / 1000));

/**
 * What the chat is doing while an answer is pending, as the real steps the
 * server reports (protocol.ts): searching, then the pages read (`reading`),
 * then writing, the long one, with the time so far. Checking the answer takes
 * milliseconds, so it is never shown as a live step. Nothing shows in the
 * first 300 ms, so a fast answer never flashes it. Not announced: the dock's
 * status line already says it is searching.
 */
export function PendingSteps({ turn, onNavigate }: { turn: Turn; onNavigate: () => void }) {
  const t = useTranslations("Ask");
  const shown = useDelayed(true);
  const elapsed = useElapsed(turn.startedAt);
  if (!shown) return <div aria-busy="true" />;

  const reading = turn.reading ?? [];
  const read = reading.length > 0;
  return (
    <div aria-busy="true" data-testid="ask-steps">
      <ol aria-label={t("steps.label")} className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {read ? <Step>{t("steps.searched")}</Step> : <ActiveStep>{t("steps.searching")}</ActiveStep>}
        {read && (
          <Step>
            {t("steps.read", { count: reading.length })}
            <PageBadges pages={reading} onNavigate={onNavigate} />
          </Step>
        )}
        {read &&
          (turn.checked === true ? (
            <>
              <Step>{t("steps.wrote")}</Step>
              <Step>{t("steps.checked")}</Step>
            </>
          ) : (
            <ActiveStep elapsed={elapsed >= ELAPSED_FROM_MS ? t("steps.seconds", { seconds: toSeconds(elapsed) }) : undefined}>
              {t("steps.writing")}
            </ActiveStep>
          ))}
      </ol>
    </div>
  );
}

/**
 * The steps of an answered question folded into one line, "Read 3 pages ·
 * 14 s", that opens to the steps and the pages. Built from the turn alone, so
 * a conversation read back from sessionStorage keeps it.
 */
export function StepsSummary({ turn, onNavigate }: { turn: Turn; onNavigate: () => void }) {
  const t = useTranslations("Ask");
  const reading = turn.reading ?? [];
  if (reading.length === 0) return null;
  return (
    <Collapsible className="group/steps flex flex-col gap-1.5 text-xs text-muted-foreground" data-testid="ask-summary">
      <CollapsibleTrigger
        className="-mx-1 inline-flex min-h-11 items-center gap-1 self-start rounded-md px-1 transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none sm:min-h-6"
        data-testid="ask-summary-toggle"
      >
        <ChevronRightIcon
          aria-hidden
          className="size-3.5 shrink-0 transition-transform group-data-[state=open]/steps:rotate-90 motion-reduce:transition-none"
        />
        <span>
          {t("steps.read", { count: reading.length })}
          {turn.elapsedMs !== undefined && (
            <>
              {" "}
              <span aria-hidden>·</span> <span className="tabular-nums">{t("steps.seconds", { seconds: toSeconds(turn.elapsedMs) })}</span>
            </>
          )}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol aria-label={t("steps.label")} className="flex flex-col gap-1.5 pb-1 pl-1">
          <Step>{t("steps.searched")}</Step>
          <Step>
            {t("steps.read", { count: reading.length })}
            <PageBadges pages={reading} onNavigate={onNavigate} />
          </Step>
          {turn.checked === true && <Step>{t("steps.checked")}</Step>}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** A finished step: past tense and a check mark. */
function Step({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckIcon aria-hidden className="mt-0.5 size-3.5 shrink-0 text-primary" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
    </li>
  );
}

/** The step in progress: a spinner and a shimmering label, both still with reduced motion. */
function ActiveStep({ children, elapsed }: { children: ReactNode; elapsed?: string | undefined }) {
  return (
    <li className="flex items-start gap-2" data-testid="ask-step-active">
      {/* Hidden: the dock's status line already says an answer is on its way. */}
      <Spinner aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <TextShimmer className="font-normal">{children}</TextShimmer>
      {elapsed !== undefined && (
        <span className="ml-auto shrink-0 text-xs tabular-nums" data-testid="ask-elapsed">
          {elapsed}
        </span>
      )}
    </li>
  );
}

function PageBadges({ pages, onNavigate }: { pages: Page[]; onNavigate: () => void }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {pages.map((page) => (
        <li key={page.url} className="min-w-0">
          {/* The pill stays small; the link around it is 44px tall on phones, where it is tapped. */}
          <NextLink
            href={page.url}
            onClick={onNavigate}
            className="group/page flex max-w-full items-center rounded-full focus-visible:outline-none max-sm:min-h-11"
          >
            <Badge
              variant="outline"
              className="h-6 max-w-full font-normal text-muted-foreground transition-colors group-hover/page:bg-muted group-focus-visible/page:ring-[3px] group-focus-visible/page:ring-ring/50"
            >
              <span className="truncate">{page.title}</span>
            </Badge>
          </NextLink>
        </li>
      ))}
    </ul>
  );
}

/** Milliseconds since `startedAt`, updated every second; 0 without a start. */
function useElapsed(startedAt: number | undefined): number {
  const [now, setNow] = useState(() => startedAt ?? 0);
  useEffect(() => {
    if (startedAt === undefined) return;
    const tick = () => {
      setNow(Date.now());
    };
    const timer = setInterval(tick, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [startedAt]);
  return startedAt === undefined ? 0 : Math.max(0, now - startedAt);
}
