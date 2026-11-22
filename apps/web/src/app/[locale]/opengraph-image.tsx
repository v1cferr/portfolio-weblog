import { localize } from "@workspace/content";
import { ImageResponse } from "next/og";
import { hasLocale } from "next-intl";

import { routing } from "@/i18n/routing";
import { getContent } from "@/lib/content";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Victor Ferreira · v1cferr.dev";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** Share card in the hub's palette: name, headline and the four lane colours. */
export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const profile = getContent().getProfile();
  const lanes = ["#2e6e5c", "#3c5a9c", "#94661c", "#8c3a59"];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#f4f6f7",
        color: "#15212b",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, fontFamily: "monospace" }}>
        v1cferr<span style={{ color: "#2e6e5c" }}>.dev</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>{profile.name}</div>
        <div style={{ fontSize: 40, color: "#5a6975" }}>{localize(profile.headline, locale).value}</div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {lanes.map((color) => (
          <div key={color} style={{ width: 120, height: 10, borderRadius: 5, background: color }} />
        ))}
      </div>
    </div>,
    size
  );
}
