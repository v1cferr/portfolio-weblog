import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";

import ClientLayout from "@/components/Homepage/ClientLayout";
import { routing } from "@/i18n/routing";

import type { Metadata, Viewport } from "next";

// Configuração do viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Page metadata
export const metadata: Metadata = {
  title: {
    template: "%s | v1cferr",
    default: "v1cferr",
  },
  description: "v1cferr - description",
  keywords: ["v1cferr", "spotify", "nextjs", "tailwindcss"],
  authors: [{ name: "v1cferr", url: "https://github.com/v1cferr" }],
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme:light)",
        href: "/favicon/dark-mode.svg",
        url: "/favicon/dark-mode.svg",
        sizes: "16x16 32x32 48x48 64x64 128x128 256x256 512x512",
      },
      {
        media: "(prefers-color-scheme:dark)",
        href: "/favicon/light-mode.svg",
        url: "/favicon/light-mode.svg",
        sizes: "16x16 32x32 48x48 64x64 128x128 256x256 512x512",
      },
    ],
  },
};

// Loads the localisation data
async function fetchLocaleData(params: Promise<{ locale: string }>) {
  const { locale } = await params;

  // Checks the locale against the routing whitelist

  // Temporiariamente desabilitado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Loads the translation messages
  const messages = await getMessages();

  return { locale, messages };
}

// Main page layout component
/**
 *
 */
export default async function HomeLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  // Fetches the localisation data
  const localeData = await fetchLocaleData(params);

  // Renders the client layout with the localisation data
  return <ClientLayout localeData={localeData}>{children}</ClientLayout>;
}
