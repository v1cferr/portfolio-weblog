"use client";

import { buttonVariants } from "@workspace/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type PointerEvent, useEffect, useRef, useState } from "react";

import { Cover, Equalizer, Progress, SpotifyIcon, useNowPlaying } from "./now-playing";
import { ExternalLink } from "@/components/external-link";

const OPEN_DELAY = 150;
const CLOSE_DELAY = 100;

/**
 * What the owner is listening to on Spotify, as a compact chip in the header
 * of every page, shown only while a track plays: Spotify's icon (attribution)
 * and a moving equalizer, no visible text, as tall as the other header icon
 * buttons. The chip is a button, not a link, so a tap on a phone opens the
 * card instead of leaving for Spotify; with a mouse, hovering opens it too.
 * In the card the track itself (cover and title) links to Spotify, and a hint
 * appears when a pointer hovers it.
 */
export function NowPlayingChip() {
  const t = useTranslations("NowPlaying");
  const { snapshot, elapsed } = useNowPlaying();
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Opened by a hovering mouse: a click then keeps it open instead of toggling it shut.
  const byHover = useRef(false);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    []
  );

  if (snapshot?.state !== "playing" || snapshot.title === undefined) return null;

  const artists = snapshot.artists?.join(", ") ?? "";
  const duration = snapshot.durationMs ?? 0;

  // Hover only enhances: a mouse opens and closes the card with a short delay; touch and pen rely on the tap.
  const schedule = (event: PointerEvent, next: boolean) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        byHover.current = next;
        setOpen(next);
      },
      next ? OPEN_DELAY : CLOSE_DELAY
    );
  };

  const track = (
    <div className="flex gap-3">
      {snapshot.coverId !== undefined && <Cover id={snapshot.coverId} className="size-16" />}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex items-center gap-1.5 truncate font-semibold">
          <span className="truncate decoration-lane-project/60 underline-offset-2 group-hover:underline">{snapshot.title}</span>
          {snapshot.trackUrl !== undefined && (
            <ExternalLinkIcon
              aria-hidden
              className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
            />
          )}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">{[artists, snapshot.album].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        clearTimeout(timer.current);
        byHover.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger
        aria-label={t("listening", { title: snapshot.title, artists })}
        className={cn(buttonVariants({ variant: "ghost" }), "h-10 gap-1.5 px-2 text-muted-foreground lg:h-8")}
        onPointerEnter={(event) => {
          schedule(event, true);
        }}
        onPointerLeave={(event) => {
          schedule(event, false);
        }}
        onClick={(event) => {
          if (open && byHover.current) {
            event.preventDefault();
            byHover.current = false;
          }
        }}
      >
        <SpotifyIcon />
        <Equalizer active />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 max-w-[calc(100vw-2rem)] p-3"
        onPointerEnter={(event) => {
          schedule(event, true);
        }}
        onPointerLeave={(event) => {
          schedule(event, false);
        }}
        // A hovering mouse should not pull the keyboard focus into the card.
        onOpenAutoFocus={(event) => {
          if (byHover.current) event.preventDefault();
        }}
      >
        <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.7rem] text-muted-foreground">
          <SpotifyIcon className="size-3.5" />
          {t("playing")}
          <Equalizer active />
        </p>
        {snapshot.trackUrl === undefined ? (
          track
        ) : (
          <ExternalLink
            href={snapshot.trackUrl}
            title={t("listen")}
            className="group -m-1.5 block rounded-xl p-1.5 outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          >
            {track}
            <span className="sr-only">{t("listen")}</span>
          </ExternalLink>
        )}
        {duration > 0 && (
          <div className="mt-3">
            <Progress elapsed={elapsed} duration={duration} label={t("progress")} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
