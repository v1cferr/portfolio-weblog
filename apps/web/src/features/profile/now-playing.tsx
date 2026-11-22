"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, type ReactNode, useEffect, useState } from "react";

import type { NowPlaying as Snapshot } from "@/lib/now-playing";

const POLL_MS = 30_000;

/**
 * What the owner is listening to on Spotify, under the avatar. The album cover
 * is the same 1-bit dither as the avatar (painted in the text colour through a
 * CSS mask, so it follows the theme) and turns into the real cover on hover or
 * focus. It polls /api/now-playing every 30 s while the tab is visible and
 * advances the progress bar locally in between. With nothing to show, it
 * renders `fallback` in the same reserved space, so the hero never jumps.
 */
export function NowPlaying({ fallback }: { fallback: ReactNode }) {
  const t = useTranslations("NowPlaying");
  const locale = useLocale();
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

  if (snapshot === undefined || snapshot.state === "off" || snapshot.title === undefined) {
    return <div className="mt-3 h-22">{fallback}</div>;
  }

  const duration = snapshot.durationMs ?? 0;
  const elapsed = Math.min(duration, (snapshot.progressMs ?? 0) + (playing ? now - Date.parse(snapshot.fetchedAt) : 0));
  const label =
    snapshot.state === "playing"
      ? t("playing")
      : snapshot.state === "paused"
        ? t("paused")
        : t("recent", { time: relative(snapshot.playedAt, now, locale) });

  return (
    <div className="glass mt-3 flex h-22 items-center gap-3 rounded-2xl border px-2.5 py-2">
      {snapshot.coverId !== undefined && <Cover id={snapshot.coverId} />}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-mono text-[0.7rem] text-muted-foreground">
          <Equalizer active={playing} />
          <span className="truncate">{label}</span>
          {snapshot.state !== "recent" && duration > 0 && (
            <span className="ml-auto whitespace-nowrap tabular-nums">
              {clock(elapsed)} / {clock(duration)}
            </span>
          )}
        </p>
        {snapshot.trackUrl !== undefined ? (
          <a
            href={snapshot.trackUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("listen")}
            className="block truncate text-sm font-semibold hover:underline hover:underline-offset-4"
          >
            {snapshot.title}
          </a>
        ) : (
          <p className="truncate text-sm font-semibold">{snapshot.title}</p>
        )}
        <p className="truncate font-mono text-xs text-muted-foreground">
          {[snapshot.artists?.join(", "), snapshot.album].filter(Boolean).join(" · ")}
        </p>
        {snapshot.state !== "recent" && duration > 0 && (
          <div
            role="progressbar"
            aria-label={t("progress")}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration / 1000)}
            aria-valuenow={Math.round(elapsed / 1000)}
            className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-border"
          >
            <span className="block h-full bg-lane-project" style={{ width: `${String((elapsed / duration) * 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

/** The cover as a dither in the text colour; the real cover fades in on hover or focus. */
function Cover({ id }: { id: string }) {
  const mask = (tone: "light" | "dark"): CSSProperties => {
    const url = `url(/api/now-playing/cover/${id}?tone=${tone})`;
    return { maskImage: url, WebkitMaskImage: url, maskSize: "cover", WebkitMaskSize: "cover" };
  };
  return (
    <span
      tabIndex={0}
      className="group/cover relative size-14 shrink-0 overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span aria-hidden className="absolute inset-0 bg-foreground [image-rendering:pixelated] dark:hidden" style={mask("light")} />
      <span aria-hidden className="absolute inset-0 hidden bg-foreground [image-rendering:pixelated] dark:block" style={mask("dark")} />
      {/* eslint-disable-next-line @next/next/no-img-element -- Spotify's own 640 px cover, shown on hover only */}
      <img
        src={`https://i.scdn.co/image/${id}`}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover/cover:opacity-100 group-focus-visible/cover:opacity-100 motion-reduce:transition-none"
      />
    </span>
  );
}

/** Three bars that bounce while a track plays and rest when it does not. */
function Equalizer({ active }: { active: boolean }) {
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

function clock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, "0")}`;
}

function relative(iso: string | undefined, now: number, locale: string): string {
  if (iso === undefined) return "";
  const minutes = Math.round((Date.parse(iso) - now) / 60_000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(hours, "hour");
  return format.format(Math.round(hours / 24), "day");
}
