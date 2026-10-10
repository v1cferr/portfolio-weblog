import "@workspace/ui/globals.css";

import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { SiteLanguageNotice } from "@/components/fallback-notice";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import { languageAlternates, languageTag } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

const fontDisplay = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const fontSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600"] });
const fontMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });
const fontSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

/** Namespaces read by client components; everything else stays on the server. */
const CLIENT_NAMESPACES = ["Nav", "Theme", "LocaleSwitcher", "Search", "Error", "Projects"] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1418" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Metadata" });
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
    openGraph: { type: "website", siteName: "v1cferr.dev", locale: languageTag(locale).replace("-", "_") },
    icons: {
      icon: [
        { url: "/favicon/light-mode.svg", media: "(prefers-color-scheme: light)" },
        { url: "/favicon/dark-mode.svg", media: "(prefers-color-scheme: dark)" },
      ],
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
      className={cn("antialiased", fontDisplay.variable, fontSans.variable, fontMono.variable, fontSerif.variable)}
    >
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <NextIntlClientProvider messages={clientMessages}>
            <TooltipProvider>
              <SiteHeader />
              <SiteLanguageNotice locale={locale} />
              <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 sm:px-6 md:pt-16">
                {children}
              </main>
              <SiteFooter />
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
