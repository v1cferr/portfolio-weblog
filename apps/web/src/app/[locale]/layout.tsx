import "@workspace/ui/globals.css";

import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Martian_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { SiteLanguageNotice } from "@/components/fallback-notice";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { Backdrop } from "@/components/backdrop";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Spotlight } from "@/components/motion/spotlight";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import { languageAlternates, languageTag } from "@/lib/i18n";
import { pageOpenGraph, xHandle } from "@/lib/metadata";
import { SITE_URL } from "@/lib/site";

// Type, chosen in a bake-off on 2026-10-23: Martian Mono for display (the
// name, page and section titles), a wide monospace that reads like a commit
// log in print; Hanken Grotesk for everything that is read; JetBrains Mono
// for dates, ids and code. CJK text falls back to the system fonts.
const fontDisplay = Martian_Mono({ subsets: ["latin"], variable: "--font-martian", axes: ["wdth"], weight: "variable" });
const fontSans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", weight: "variable" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

/**
 * Every new visit starts from the system theme. next-themes always persists a
 * manual choice in localStorage; this runs before it and drops that choice when
 * the tab has not started a session yet, so the choice lasts for the tab (and
 * its reloads) and never into the next visit.
 */
const THEME_SESSION_SCRIPT = `try{if(!sessionStorage.getItem("hub-theme-session")){localStorage.removeItem("theme");sessionStorage.setItem("hub-theme-session","1")}}catch(e){}`;

/** Namespaces read by client components; everything else stays on the server. */
const CLIENT_NAMESPACES = ["Nav", "Explorer", "Theme", "LocaleSwitcher", "Search", "Ask", "Error", "Projects", "NowPlaying"] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e1e2e7" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1b26" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const handle = xHandle();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
    applicationName: "v1cferr.dev",
    authors: [{ name: "Victor Ferreira", url: SITE_URL }],
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates("/"),
      types: { "application/rss+xml": `/${locale}/weblog/rss.xml` },
    },
    // The site card comes from opengraph-image.tsx next to this layout.
    openGraph: { type: "website", ...pageOpenGraph(locale, "/") },
    // X falls back to the Open Graph title, description and image.
    twitter: { card: "summary_large_image", ...(handle !== undefined && { site: handle, creator: handle }) },
    // icon.svg switches its own colour (black on light themes, white on dark);
    // favicon.ico and the Apple icon are opaque tiles for clients without SVG.
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]"> & { children: ReactNode }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = await getMessages();
  const clientMessages = Object.fromEntries(CLIENT_NAMESPACES.map((namespace) => [namespace, messages[namespace]]));

  return (
    <html
      lang={languageTag(locale)}
      suppressHydrationWarning
      className={cn("antialiased", fontDisplay.variable, fontSans.variable, fontMono.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SESSION_SCRIPT }} />
        {/* Entrances start hidden; without JavaScript they would stay that way. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="relative isolate flex min-h-dvh flex-col">
        <ThemeProvider>
          <NextIntlClientProvider messages={clientMessages}>
            <TooltipProvider>
              <MotionProvider>
                <Backdrop />
                <Spotlight />
                <SiteHeader />
                <SiteLanguageNotice locale={locale} />
                <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 sm:px-6 md:pt-16">
                  {children}
                </main>
                <SiteFooter />
              </MotionProvider>
            </TooltipProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        {/* The scripts are served by Vercel's edge; elsewhere they would 404. */}
        {process.env.VERCEL === "1" && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
