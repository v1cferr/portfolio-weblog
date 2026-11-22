"use client";

import { buttonVariants } from "@workspace/ui/components/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@workspace/ui/components/hover-card";
import { cn } from "@workspace/ui/lib/utils";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Cover, Equalizer, Progress, SpotifyIcon, useNowPlaying } from "./now-playing";
import { ExternalLink } from "@/components/external-link";

/**
 * What the owner is playing on Spotify, as a small chip in the header of every
 * page, shown only while a track plays, attributed with Spotify's icon. The
 * chip links to the track (a tap on touch screens opens Spotify); on hover or
 * focus a card shows the cover, the album and the progress.
 */
export function NowPlayingChip() {
  const t = useTranslations("NowPlaying");
  const { snapshot, elapsed } = useNowPlaying();
  if (snapshot?.state !== "playing" || snapshot.title === undefined) return null;

  const artists = snapshot.artists?.join(", ") ?? "";
  const label = t("listening", { title: snapshot.title, artists });
  const duration = snapshot.durationMs ?? 0;

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <ExternalLink
          href={snapshot.trackUrl ?? "https://open.spotify.com"}
          aria-label={label}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 px-2 text-muted-foreground")}
        >
          <SpotifyIcon />
          <Equalizer active />
          <span aria-hidden className="hidden max-w-56 truncate xl:inline">
            {snapshot.title}
            {artists !== "" && ` — ${artists}`}
          </span>
        </ExternalLink>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="glass-float w-80 rounded-2xl border p-3">
        <div className="flex gap-3">
          {snapshot.coverId !== undefined && <Cover id={snapshot.coverId} className="size-16" />}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="flex items-center gap-1.5 font-mono text-[0.7rem] text-muted-foreground">
              <SpotifyIcon className="size-3.5" />
              {t("playing")}
              <Equalizer active />
            </p>
            <p className="truncate font-semibold">{snapshot.title}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{[artists, snapshot.album].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        {duration > 0 && (
          <div className="mt-3">
            <Progress elapsed={elapsed} duration={duration} label={t("progress")} />
          </div>
        )}
        {snapshot.trackUrl !== undefined && (
          <ExternalLink
            href={snapshot.trackUrl}
            className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {t("listen")} <ExternalLinkIcon aria-hidden className="size-3" />
          </ExternalLink>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
