import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { type Locale, routing } from "@/i18n/routing";

import { OG_IMAGE_ID } from "./metadata";

/*
 * Share cards (Open Graph and X) for the opengraph-image routes. One layout in
 * the dark Tokyo Night palette: the hex dot grid of the page background, the
 * V1C mark, a Nix store path as the eyebrow, the title in Martian Mono and a
 * shell prompt in the lane colour of the section.
 *
 * Fonts: static instances of Martian Mono (400, 600) and Hanken Grotesk (400,
 * 500) from Google Fonts, subset to Latin-1 + Latin Extended-A and a few
 * punctuation marks with fonttools' pyftsubset, under assets/fonts with their
 * OFL licences. Satori reads TTF but not WOFF2 or variable fonts, so the files
 * next/font ships to the browser cannot be reused here.
 */

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * The single entry a card route returns from generateImageMetadata. The
 * routes use it instead of a static `alt` export because the alt text follows
 * the page's locale (and title); the card is served at
 * <route>/opengraph-image/card (OG_IMAGE_ID).
 *
 * With generateImageMetadata the route's own generateStaticParams is not
 * used (Next.js only lists the image ids), so the cards are not prerendered:
 * each renders on its first request and is then cached like an ISR page. An
 * unknown slug or id returns no image metadata, which the route answers 404.
 */
export function ogImageMetadata(alt: string) {
  return [{ id: OG_IMAGE_ID, alt, size: OG_SIZE, contentType: "image/png" }];
}

/** The route's locale param; route handlers sit outside the [locale] layout, so it is checked here. */
export function ogLocale(requested: string): Locale {
  return hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
}

/** Alt text of a card: "<title> — v1cferr.dev", in the page's language. */
export async function ogImageAlt(locale: Locale, title: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return t("imageAlt", { title });
}

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

async function font(name: string, file: string, weight: 400 | 500 | 600) {
  return { name, data: await readFile(path.join(FONT_DIR, file)), weight, style: "normal" as const };
}

// Read once per server process; the files do not depend on the request.
const FONTS = await Promise.all([
  font("Martian Mono", "MartianMono-Regular.ttf", 400),
  font("Martian Mono", "MartianMono-SemiBold.ttf", 600),
  font("Hanken Grotesk", "HankenGrotesk-Regular.ttf", 400),
  font("Hanken Grotesk", "HankenGrotesk-Medium.ttf", 500),
]);

/** Tokyo Night (Night), the same values as the .dark tokens in globals.css. */
const PALETTE = {
  background: "#1a1b26",
  foreground: "#c0caf5",
  muted: "#a9b1d6",
  faint: "#565f89",
  border: "#3b4261",
};

export type OgLane = "career" | "project" | "study" | "writing";

export const LANE_COLOURS: Record<OgLane, string> = {
  career: "#73daca",
  project: "#7aa2f7",
  study: "#e0af68",
  writing: "#bb9af7",
};

export interface OgCard {
  /** Nix store path of the content the page is built from (lib/store-path.ts). */
  storePath: string;
  title: string;
  subtitle?: string | undefined;
  /** Small mono line under the subtitle: a date, a period, technologies. */
  meta?: string | undefined;
  /** Section name, next to the lane dot. */
  section?: string | undefined;
  /** The section's lane; undefined for the site card, which shows all four. */
  lane?: OgLane | undefined;
  /** What the prompt line runs, e.g. "open /projects/obsidian-rag". */
  command: string;
}

/** Cuts text at a word boundary so it never relies on the renderer to clip. */
function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Martian Mono is wide; the title steps down as it grows so it stays within three lines. */
function titleSize(title: string): number {
  if (title.length <= 16) return 80;
  if (title.length <= 28) return 64;
  if (title.length <= 44) return 54;
  return 46;
}

/** /nix/store/abcdefg…-name, shortened the way the page eyebrows show it. */
function shortStorePath(label: string): string {
  const match = /^\/nix\/store\/([0-9a-z]+)-(.+)$/.exec(label);
  if (match === null) return label;
  const [, hash = "", name = ""] = match;
  return `/nix/store/${hash.slice(0, 7)}…-${clip(name, 40)}`;
}

/** The V1C mark, the same paths as components/v1c-logo.tsx. */
function V1cMark({ size, colour }: { size: number; colour: string }) {
  return (
    <svg width={size} height={size} viewBox="0 -13.5 216 216" fill={colour}>
      <path d="M0.264518 1.1765C-0.0296 1.52944 0.852753 3.29415 4.99981 10.4412L10.088 19.2941H29.5292H48.9704L63.6763 44.7942C71.7939 58.853 84.5292 80.9118 91.9998 93.853C99.4704 106.794 105.941 118 106.382 118.765C106.912 119.735 107.353 120.177 107.735 120.177C108.235 120.177 110.235 116.912 118.265 103C124.529 92.1177 128.117 85.6471 128 85.353C127.853 84.9412 126.676 84.8824 118.029 84.8824H108.265L92.941 58.3236C84.5292 43.7353 73.6175 24.853 68.7057 16.353L59.7939 0.911792L30.2057 0.823557C4.76452 0.764733 0.558635 0.823557 0.264518 1.1765Z" />
      <path d="M77.9408 1.26482C77.7349 1.67658 80.382 6.52952 90.0585 23.2648C96.882 35.0589 105.735 50.353 109.706 57.2354L116.911 69.7354L135.794 69.8236C146.206 69.853 154.647 70.0001 154.588 70.1178C154.5 70.353 145.853 85.353 117.058 135.177C112.058 143.824 107.853 150.882 107.735 150.853C107.617 150.824 92.382 124.618 73.9114 92.6178L40.3232 34.4413L30.1467 34.3531C20.5879 34.2942 19.9408 34.3236 19.6761 34.8236C19.382 35.3825 18.9408 34.5883 35.0879 62.5295C43.2349 76.6472 55.3232 97.5883 66.4408 116.853C99.3526 173.882 107.676 188.265 107.735 188.324C107.764 188.382 122.853 162.294 141.264 130.382C159.706 98.5001 183.558 57.1472 194.294 38.5589C205.029 19.9413 214.206 4.05894 214.676 3.23541C216.176 0.617759 216.647 0.735406 204.882 0.823641L194.588 0.911876L180.029 26.1178L165.47 51.353H146.706C130.794 51.353 127.911 51.2942 127.617 50.9413C127.264 50.5001 109.353 19.5589 109.353 19.3825C109.353 19.3236 122.235 19.2942 137.97 19.2942H166.588L171.647 10.5001C174.97 4.76482 176.647 1.55894 176.529 1.23541C176.353 0.794229 172.529 0.764818 127.264 0.764818C80.8232 0.764818 78.1761 0.794229 77.9408 1.26482Z" />
    </svg>
  );
}

/*
 * The page backdrop as an SVG pattern: dots on a 60° lattice (24 × 41.57 px
 * cell, a second dot offset by half a cell), like components/backdrop.tsx.
 */
const DOT_GRID = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><pattern id="d" width="24" height="41.57" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r="1.2" fill="#c0caf5" fill-opacity="0.2"/><circle cx="13.2" cy="21.985" r="1.2" fill="#c0caf5" fill-opacity="0.2"/></pattern><radialGradient id="f" cx="0.5" cy="0" r="1"><stop offset="0" stop-color="#fff"/><stop offset="0.75" stop-color="#fff" stop-opacity="0.15"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="m"><rect width="1200" height="630" fill="url(#f)"/></mask></defs><rect width="1200" height="630" fill="url(#d)" mask="url(#m)"/></svg>`
)}`;

/** A soft circle of the lane colour, drawn as SVG so it fades without a visible edge. */
function glow(colour: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><radialGradient id="g"><stop offset="0" stop-color="${colour}" stop-opacity="0.16"/><stop offset="1" stop-color="${colour}" stop-opacity="0"/></radialGradient></defs><circle cx="1080" cy="40" r="440" fill="url(#g)"/></svg>`
  )}`;
}

export function renderOgImage(card: OgCard): ImageResponse {
  const accent = card.lane === undefined ? PALETTE.foreground : LANE_COLOURS[card.lane];
  const lanes = Object.entries(LANE_COLOURS) as [OgLane, string][];
  const title = clip(card.title, 72);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: PALETTE.background,
        color: PALETTE.foreground,
        fontFamily: "Hanken Grotesk",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>. */}
      <img src={DOT_GRID} width={1200} height={630} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      {/* The lane glow in the top right corner, like the brand tint on the hero. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders plain <img>. */}
      <img src={glow(accent)} width={1200} height={630} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "56px 72px 52px",
        }}
      >
        {/* Header: the mark and the domain, the section on the right. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <V1cMark size={52} colour={PALETTE.foreground} />
            <div style={{ display: "flex", fontFamily: "Martian Mono", fontSize: 26, fontWeight: 600 }}>
              v1cferr<span style={{ color: accent }}>.dev</span>
            </div>
          </div>
          {card.section !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px",
                borderRadius: 999,
                border: `1px solid ${PALETTE.border}`,
                background: "rgba(31, 35, 53, 0.8)",
                fontFamily: "Martian Mono",
                fontSize: 22,
                color: PALETTE.foreground,
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: 7, background: accent }} />
              {card.section}
            </div>
          )}
        </div>

        {/* Body: store path, title, subtitle, meta. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Martian Mono", fontSize: 20, color: PALETTE.faint, marginBottom: 22 }}>
            {shortStorePath(card.storePath)}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Martian Mono",
              fontWeight: 600,
              fontSize: titleSize(title),
              lineHeight: 1.12,
              letterSpacing: -1.5,
              color: PALETTE.foreground,
            }}
          >
            {title}
          </div>
          {card.subtitle !== undefined && (
            <div style={{ display: "flex", marginTop: 22, fontSize: 32, lineHeight: 1.35, color: PALETTE.muted }}>
              {clip(card.subtitle, 120)}
            </div>
          )}
          {card.meta !== undefined && (
            <div style={{ display: "flex", marginTop: 18, fontFamily: "Martian Mono", fontSize: 20, color: accent }}>
              {clip(card.meta, 70)}
            </div>
          )}
        </div>

        {/* Footer: the shell prompt and the four lanes, this section's lit. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", minWidth: 0, overflow: "hidden", fontFamily: "Martian Mono", fontSize: 22 }}>
            <span style={{ color: LANE_COLOURS.career }}>victor@hub</span>
            <span style={{ color: PALETTE.faint }}>:</span>
            <span style={{ color: LANE_COLOURS.project }}>~</span>
            <span style={{ color: PALETTE.faint }}>$&nbsp;</span>
            <span style={{ color: PALETTE.muted }}>{clip(card.command, 30)}</span>
          </div>
          <div style={{ display: "flex", flexShrink: 0, gap: 10 }}>
            {lanes.map(([lane, colour]) => (
              <div
                key={lane}
                style={{
                  width: 72,
                  height: 8,
                  borderRadius: 4,
                  background: colour,
                  opacity: card.lane === undefined || card.lane === lane ? 1 : 0.25,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: FONTS }
  );
}
