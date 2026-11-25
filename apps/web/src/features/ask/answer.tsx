"use client";

import { Button } from "@workspace/ui/components/button";
import { InfoIcon, SearchIcon } from "lucide-react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Fragment } from "react";

import type { AskSource } from "@/lib/ask/protocol";

import type { Turn } from "./turn";

/**
 * One answer of the profile chat (ADR 0011), in each of its modes: the model's
 * text with numbered citations, the site's passages (extractive), "I don't
 * know" (unknown) and "not on the site" (no-source). Links navigate without
 * closing the dock; `onNavigate` lets the dock step aside on phones, where it
 * covers the page.
 */
export function Answer({ turn, onNavigate, onSearch }: { turn: Turn; onNavigate: () => void; onSearch: (question: string) => void }) {
  const t = useTranslations("Ask");
  const locale = useLocale();
  const streaming = turn.phase === "searching" || turn.phase === "streaming";
  const byNumber = new Map(turn.sources.flatMap((source) => (source.n === null ? [] : [[source.n, source] as const])));

  if (turn.phase === "searching") {
    if (turn.reading !== undefined && turn.reading.length > 0) {
      return (
        <div aria-busy="true" className="flex flex-col gap-1.5 text-sm text-muted-foreground" data-testid="ask-reading">
          <p className="motion-safe:animate-pulse">{t("status.reading", { count: turn.reading.length })}</p>
          <ul className="flex flex-wrap gap-1.5">
            {turn.reading.map((page) => (
              <li key={page.url} className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs">
                {page.title}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <p aria-busy="true" className="text-sm text-muted-foreground motion-safe:animate-pulse">
        {t("status.searching")}
      </p>
    );
  }
  if (turn.phase === "failed") {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("error")}
      </p>
    );
  }

  if (turn.mode === "no-source") {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 text-sm" data-testid="ask-no-source">
        <p className="font-medium">{t("noSource.title")}</p>
        <p className="text-muted-foreground">{t("noSource.body")}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-1.5"
            onClick={() => {
              onSearch(turn.question);
            }}
          >
            <SearchIcon aria-hidden />
            {t("noSource.search")}
          </Button>
          <Button asChild variant="outline" className="h-11">
            <NextLink href={`/${locale}/about`} onClick={onNavigate}>
              {t("noSource.about")}
            </NextLink>
          </Button>
        </div>
      </div>
    );
  }

  if (turn.mode === "unknown") {
    return (
      <div className="flex flex-col gap-2" data-testid="ask-unknown">
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
          <p className="font-medium">{t("unknown.title")}</p>
          <p className="text-muted-foreground">{t("unknown.body")}</p>
        </div>
        {turn.sources.length > 0 && <SourceList sources={turn.sources} onNavigate={onNavigate} heading={t("unknown.read")} />}
      </div>
    );
  }

  if (turn.mode === "extractive") {
    return (
      <div className="flex flex-col gap-2" data-testid="ask-extractive">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <span className="font-medium text-foreground">{t("extractive.label")}.</span> {t(`extractive.${turn.reason ?? "unavailable"}`)}
          </span>
        </p>
        <SourceList sources={turn.sources} onNavigate={onNavigate} heading={t("sources")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={streaming} data-testid="ask-answer">
      <p className="text-sm leading-relaxed whitespace-pre-line">
        {turn.parts.map((part, index) =>
          part.type === "text" ? (
            <Fragment key={index}>{part.text}</Fragment>
          ) : (
            <Citation key={index} n={part.n} source={byNumber.get(part.n)} onNavigate={onNavigate} />
          )
        )}
      </p>
      {turn.partial === true && !streaming && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground" data-testid="ask-partial">
          <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{t("partial")}</span>
        </p>
      )}
      {turn.phase === "stopped" && <p className="text-xs text-muted-foreground">{t("stoppedNote")}</p>}
      {turn.interrupted === true && <p className="text-xs text-destructive">{t("interrupted")}</p>}
      {turn.sources.length > 0 && <SourceList sources={turn.sources} onNavigate={onNavigate} heading={t("sources")} />}
      {!streaming && <p className="text-xs text-muted-foreground">{t("disclosure")}</p>}
    </div>
  );
}

function Citation({ n, source, onNavigate }: { n: number; source: AskSource | undefined; onNavigate: () => void }) {
  const t = useTranslations("Ask");
  const label = `[${String(n)}]`;
  if (source === undefined) return <sup className="ml-0.5 text-xs text-muted-foreground">{label}</sup>;
  return (
    <sup className="ml-0.5">
      <NextLink
        href={source.url}
        onClick={onNavigate}
        aria-label={`${t("citation", { n })}: ${source.title}`}
        className="rounded px-0.5 text-xs font-medium underline underline-offset-2 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {label}
      </NextLink>
    </sup>
  );
}

function SourceList({ sources, heading, onNavigate }: { sources: AskSource[]; heading: string; onNavigate: () => void }) {
  const t = useTranslations("Ask");
  if (sources.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{heading}</h3>
      <ul className="flex flex-col gap-2">
        {sources.map((source) => (
          <li key={source.url}>
            <NextLink
              href={source.url}
              onClick={onNavigate}
              className="flex min-h-11 gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none motion-reduce:transition-none"
            >
              <span
                aria-hidden={source.n === null}
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums"
              >
                {source.n ?? "·"}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {source.n === null && <span className="sr-only">{t("related")}: </span>}
                  {source.title}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">{source.url}</span>
                {source.excerpt !== undefined && <span className="text-sm text-muted-foreground">{source.excerpt}</span>}
              </span>
            </NextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
