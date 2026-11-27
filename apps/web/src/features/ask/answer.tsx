"use client";

import { Button } from "@workspace/ui/components/button";
import { Markdown } from "@workspace/ui/components/markdown";
import { InfoIcon, SearchIcon, SparklesIcon } from "lucide-react";
import NextLink from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { type ComponentProps, useMemo } from "react";

import { InfoTip } from "@/components/info-tip";
import type { AskSource } from "@/lib/ask/protocol";

import { useAsk } from "./ask-provider";
import { PendingSteps, StepsSummary } from "./steps";
import { CITE_HREF, toMarkdown, type Turn } from "./turn";

/**
 * One answer of the profile chat (ADR 0011), in each of its modes: the model's
 * text (light Markdown) with numbered citations, the site's passages
 * (extractive), "I don't know" (unknown), "not on the site" (no-source) and
 * the fixed small-talk reply. Links navigate without
 * closing the dock; `onNavigate` lets the dock step aside on phones, where it
 * covers the page. The model's answers speak as the owner, in the first person,
 * so each one carries a visible label saying AI wrote it on the owner's behalf.
 */
export function Answer({ turn, onNavigate, onSearch }: { turn: Turn; onNavigate: () => void; onSearch: (question: string) => void }) {
  const t = useTranslations("Ask");
  const locale = useLocale();
  const streaming = turn.phase === "searching" || turn.phase === "streaming";
  const byNumber = useMemo(
    () => new Map(turn.sources.flatMap((source) => (source.n === null ? [] : [[source.n, source] as const]))),
    [turn.sources]
  );

  if (turn.phase === "searching") return <PendingSteps turn={turn} onNavigate={onNavigate} />;
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
        <StepsSummary turn={turn} onNavigate={onNavigate} />
        <AiLabel />
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

  if (turn.mode === "small-talk") {
    return (
      <div className="flex flex-col gap-3" data-testid="ask-small-talk">
        <p className="text-sm leading-relaxed">{turn.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}</p>
        {/* A fixed reply, then what the visitor could ask: the same suggestions as an empty conversation. */}
        <FollowUps questions={(t.raw("suggestions") as string[]).slice(0, 3)} heading={t("suggestionsTitle")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={streaming} data-testid="ask-answer">
      <StepsSummary turn={turn} onNavigate={onNavigate} />
      <AiLabel />
      <AnswerText turn={turn} byNumber={byNumber} onNavigate={onNavigate} />
      {turn.partial === true && !streaming && (
        <p className="flex items-start gap-2 text-xs text-muted-foreground" data-testid="ask-partial">
          <InfoIcon aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>{t("partial")}</span>
        </p>
      )}
      {turn.phase === "stopped" && <p className="text-xs text-muted-foreground">{t("stoppedNote")}</p>}
      {turn.interrupted === true && <p className="text-xs text-destructive">{t("interrupted")}</p>}
      {!streaming && turn.suggestions !== undefined && turn.suggestions.length > 0 && <FollowUps questions={turn.suggestions} />}
      {turn.sources.length > 0 && <SourceList sources={turn.sources} onNavigate={onNavigate} heading={t("sources")} />}
    </div>
  );
}

/**
 * The model's text as Markdown (prompt-kit's Markdown: no raw HTML, lists and
 * emphasis kept), with each citation as a small numbered link to its page.
 * The only links in it are the citation markers (turn.ts); anything else that
 * looks like a link is shown as its text.
 */
function AnswerText({ turn, byNumber, onNavigate }: { turn: Turn; byNumber: Map<number, AskSource>; onNavigate: () => void }) {
  const markdown = toMarkdown(turn.parts);
  const components = useMemo(
    () => ({
      a: ({ href, children }: ComponentProps<"a">) => {
        const n = CITE_HREF.exec(href ?? "")?.[1];
        return n === undefined ? <>{children}</> : <Citation n={Number(n)} source={byNumber.get(Number(n))} onNavigate={onNavigate} />;
      },
      p: ({ children }: ComponentProps<"p">) => <p className="leading-relaxed">{children}</p>,
      ul: ({ children }: ComponentProps<"ul">) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }: ComponentProps<"ol">) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
      strong: ({ children }: ComponentProps<"strong">) => <strong className="font-semibold">{children}</strong>,
    }),
    [byNumber, onNavigate]
  );
  return (
    <Markdown className="flex flex-col gap-2 text-sm break-words" components={components}>
      {markdown}
    </Markdown>
  );
}

/** "Want to know more?": the related pages as one-tap questions, asked like any other. */
function FollowUps({ questions, heading }: { questions: string[]; heading?: string }) {
  const t = useTranslations("Ask");
  const { ask, busy } = useAsk();
  return (
    <section className="flex flex-col gap-2" data-testid="ask-follow-ups">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{heading ?? t("more")}</h3>
      <ul className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <li key={question} className="max-w-full">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="h-auto min-h-11 max-w-full rounded-full px-3 py-2 text-left text-sm font-normal whitespace-normal"
              onClick={() => {
                ask(question);
              }}
            >
              {question}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Says who wrote the answer: AI, in the owner's voice, so nobody takes it for
 * the owner typing. The "may be wrong, check the sources" note is behind the
 * "i" next to it.
 */
function AiLabel() {
  const t = useTranslations("Ask");
  return (
    <div className="flex items-center gap-1 self-start">
      <p
        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground"
        data-testid="ask-ai-label"
      >
        <SparklesIcon aria-hidden className="size-3.5 shrink-0 text-primary" />
        {t("aiLabel")}
      </p>
      <InfoTip label={t("aiInfoLabel")} side="top" align="start" className="max-sm:size-11">
        <span data-testid="ask-disclosure">{t("disclosure")}</span>
      </InfoTip>
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
        // The number stays small in the line; an invisible padding around it makes it a 44px target.
        className="relative rounded px-0.5 text-xs font-medium underline underline-offset-2 before:absolute before:-inset-x-2 before:-inset-y-3.5 before:content-[''] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
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
