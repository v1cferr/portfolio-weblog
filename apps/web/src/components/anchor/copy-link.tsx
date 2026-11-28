"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { HashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { markAnchorTarget } from "./hash-target";

/** How long the confirmation stays. */
const DONE_FOR = 1500;

/**
 * The "#" beside a shareable element: copies the page URL with the element's
 * fragment and puts the fragment in the address bar. It shows while the
 * element (a `group/anchor`) is hovered or the button has keyboard focus, and
 * stays faintly visible on touch screens, which have no hover.
 *
 * The accessible name is "Copy link to <name>": `name` as text, or `nameId`,
 * the id of the element whose text names the target (a heading).
 */
export function CopyLink({
  id,
  name,
  nameId,
  className,
}: {
  /** The target's id: the fragment the link carries. */
  id: string;
  name?: string;
  nameId?: string;
  className?: string;
}) {
  const t = useTranslations("Common");
  const prefixId = useId();
  const [state, setState] = useState<"idle" | "copied" | "address-bar">("idle");
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => {
      setState("idle");
    }, DONE_FOR);
    return () => {
      clearTimeout(timer);
    };
  }, [state]);

  const copy = async () => {
    const url = new URL(window.location.href);
    url.hash = id;
    // Next.js syncs its router with history.replaceState; null keeps its own state.
    window.history.replaceState(null, "", url.href);
    markAnchorTarget();
    try {
      await navigator.clipboard.writeText(url.href);
      setState("copied");
    } catch {
      // No clipboard (permission denied, insecure context): the URL is in the address bar.
      setState("address-bar");
    }
  };

  const done = state === "copied" ? t("linkCopied") : state === "address-bar" ? t("linkInAddressBar") : "";

  // The tooltip mounts on the first interaction, not with the page: a page like /setup has 150 of these buttons,
  // and a Radix tooltip each was ~130 ms of main-thread work during hydration. Arming swaps the button for a new
  // one inside the tooltip, so it must happen before a click can start on it: when the pointer enters the element
  // the link belongs to (the button stays invisible until then), on focus (the button gets focus back), or after a
  // tap's copy (touch has no hover tooltip, only the "copied" one).
  const button = useRef<HTMLButtonElement>(null);
  const [armed, setArmed] = useState(false);
  const refocus = useRef(false);
  const arm = () => {
    if (armed) return;
    refocus.current = document.activeElement === button.current;
    setArmed(true);
  };
  useLayoutEffect(() => {
    if (!armed || !refocus.current) return;
    refocus.current = false;
    button.current?.focus({ preventScroll: true });
  }, [armed]);
  useEffect(() => {
    if (armed) return;
    const area = button.current?.closest<HTMLElement>("[data-anchor]") ?? button.current;
    if (!area) return;
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType !== "touch") setArmed(true);
    };
    area.addEventListener("pointerenter", onEnter);
    return () => {
      area.removeEventListener("pointerenter", onEnter);
    };
  }, [armed]);

  const trigger = (
    <button
      ref={button}
      type="button"
      data-copy-link={id}
      data-copy-state={state}
      {...(nameId === undefined ? { "aria-label": `${t("copyLinkTo")} ${name ?? id}` } : { "aria-labelledby": `${prefixId} ${nameId}` })}
      onFocus={arm}
      onClick={() => {
        arm();
        void copy();
      }}
      className={cn(
        "relative inline-flex size-6 shrink-0 items-center justify-center rounded-md align-middle text-muted-foreground transition-[opacity,color] hover:text-foreground focus-visible:text-foreground",
        // Hidden until the element is hovered or the button focused; faint but present where there is no hover.
        "opacity-0 group-hover/anchor:opacity-100 focus-visible:opacity-100 data-[copy-state=address-bar]:opacity-100 data-[copy-state=copied]:opacity-100 [@media(hover:none)]:opacity-60",
        // A 24px target with a larger invisible hit area for touch.
        "after:absolute after:-inset-2 after:content-['']",
        className
      )}
    >
      {nameId !== undefined && (
        <span id={prefixId} hidden>
          {t("copyLinkTo")}
        </span>
      )}
      <HashIcon aria-hidden className="size-3.5" />
      <span className="sr-only" aria-live="polite">
        {done}
      </span>
    </button>
  );

  if (!armed) return trigger;
  return (
    <Tooltip open={hover || state !== "idle"} onOpenChange={setHover}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="top">{state === "idle" ? t("copyLink") : done}</TooltipContent>
    </Tooltip>
  );
}
