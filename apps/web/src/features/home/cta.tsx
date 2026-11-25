"use client";

import { track } from "@vercel/analytics";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowUpIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { openAsk } from "@/features/ask/open-ask";
import { Link } from "@/i18n/navigation";
import { MAX_QUESTION } from "@/lib/ask/protocol";

/*
 * The home page's calls to action: small client pieces inside server-rendered
 * sections, so the hero stays static HTML apart from these buttons. Each one
 * records a Vercel Analytics event; the Ask ones open the docked Ask panel
 * through the shared `openAsk` event.
 */

export type AskFrom = "hero" | "input" | "start_here";

/** Opens the Ask panel, optionally with a question already sent. */
export function AskButton({
  from,
  question,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick" | "type"> & { from: AskFrom; question?: string; children: ReactNode }) {
  return (
    <Button
      type="button"
      onClick={() => {
        track("cta_ask", { from });
        openAsk(question === undefined ? {} : { question });
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

/** A plain anchor (mailto:, the CV file) that records `event` when followed. */
export function TrackedAnchor({ event, ...props }: ComponentProps<"a"> & { event: string }) {
  return (
    <a
      onClick={() => {
        track(event);
      }}
      {...props}
    />
  );
}

/** A localized site link that records `event` when followed. */
export function TrackedLink({ event, ...props }: ComponentProps<typeof Link> & { event: string }) {
  return (
    <Link
      onClick={() => {
        track(event);
      }}
      {...props}
    />
  );
}

/**
 * "Ask me anything": a one-line form that opens the Ask panel with the
 * question. An empty submit still opens the panel, so the field never feels dead.
 */
export function AskInput({
  label,
  placeholder,
  submit,
  className,
}: {
  label: string;
  placeholder: string;
  submit: string;
  className?: string;
}) {
  return (
    <form
      aria-label={label}
      className={cn("relative flex max-w-md items-center", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const field = event.currentTarget.elements.namedItem("question") as HTMLInputElement;
        const question = field.value.trim();
        track("cta_ask", { from: "input" });
        openAsk(question === "" ? {} : { question });
        field.value = "";
      }}
    >
      <Input
        name="question"
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        maxLength={MAX_QUESTION}
        className="h-11 rounded-full pr-12 pl-4 md:text-sm"
      />
      <Button type="submit" size="icon" aria-label={submit} className="absolute right-1.5 rounded-full">
        <ArrowUpIcon aria-hidden />
      </Button>
    </form>
  );
}
