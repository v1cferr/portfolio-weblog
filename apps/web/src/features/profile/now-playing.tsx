"use client";

import { cn } from "@workspace/ui/lib/utils";
import { type CSSProperties, useEffect, useState } from "react";

import type { NowPlaying as Snapshot } from "@/lib/now-playing";

/*
 * The pieces of the Spotify "now playing" UI: the data hook, the dithered
 * cover, the equalizer and the progress bar. The header chip composes them.
 */

const POLL_MS = 30_000;

/**
 * Polls /api/now-playing every 30 s while the tab is visible (and pauses when
 * it is hidden), and advances the elapsed time locally every second while a
 * track plays, so the progress bar moves without extra requests.
 */
export function useNowPlaying(): { snapshot: Snapshot | undefined; elapsed: number } {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/now-playing")
        .then((response) => (response.ok ? (response.json() as Promise<Snapshot>) : undefined))
        .then((next) => {
          if (!cancelled && next !== undefined) setSnapshot(next);
        })
        .catch(() => {
          // Offline or blocked: keep whatever is on screen.
        });
    };
    let poll: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      poll ??= setInterval(load, POLL_MS);
    };
    const stop = () => {
      clearInterval(poll);
      poll = undefined;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        load();
        start();
      } else stop();
    };
    load();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const playing = snapshot?.state === "playing";
  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(tick);
    };
  }, [playing]);

  const duration = snapshot?.durationMs ?? 0;
  const elapsed =
    snapshot === undefined ? 0 : Math.min(duration, (snapshot.progressMs ?? 0) + (playing ? now - Date.parse(snapshot.fetchedAt) : 0));
  return { snapshot, elapsed };
}

/** The cover as a dither in the text colour; the real cover fades in on hover. */
export function Cover({ id, className }: { id: string; className?: string }) {
  const mask = (tone: "light" | "dark"): CSSProperties => {
    const url = `url(/api/now-playing/cover/${id}?tone=${tone})`;
    return { maskImage: url, WebkitMaskImage: url, maskSize: "cover", WebkitMaskSize: "cover" };
  };
  return (
    <span className={cn("group/cover relative shrink-0 overflow-hidden rounded-lg", className)}>
      <span aria-hidden className="absolute inset-0 bg-foreground [image-rendering:pixelated] dark:hidden" style={mask("light")} />
      <span aria-hidden className="absolute inset-0 hidden bg-foreground [image-rendering:pixelated] dark:block" style={mask("dark")} />
      {/* eslint-disable-next-line @next/next/no-img-element -- Spotify's own cover, shown on hover only */}
      <img
        src={`https://i.scdn.co/image/${id}`}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover/cover:opacity-100 motion-reduce:transition-none"
      />
    </span>
  );
}

/** Three bars that bounce while a track plays and rest when it does not. */
export function Equalizer({ active }: { active: boolean }) {
  return (
    <span aria-hidden className="flex h-3 items-end gap-px">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className={cn("w-0.5 rounded-full bg-lane-project", active ? "equalizer-bar h-3" : "h-1")}
          style={{ animationDelay: `${String(bar * -0.35)}s` }}
        />
      ))}
    </span>
  );
}

/** A thin progress bar with an accessible name, and the times beside it. */
export function Progress({ elapsed, duration, label }: { elapsed: number; duration: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration / 1000)}
        aria-valuenow={Math.round(elapsed / 1000)}
        className="h-0.5 flex-1 overflow-hidden rounded-full bg-border"
      >
        <span className="block h-full bg-lane-project" style={{ width: `${String(duration > 0 ? (elapsed / duration) * 100 : 0)}%` }} />
      </div>
      <span className="font-mono text-[0.7rem] whitespace-nowrap text-muted-foreground tabular-nums">
        {clock(elapsed)} / {clock(duration)}
      </span>
    </div>
  );
}

export function clock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;
}
