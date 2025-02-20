import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import Loading from "@/components/Loading";
import { getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import WorkInProgress from "@/components/WIP/WorkInProgress";
import Header from "@/components/Header";
import "@/styles/global.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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

export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} h-screen overflow-hidden`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange>
          <NextIntlClientProvider messages={messages}>
            {/* TODO: Melhorar o scrollbar e também ficar "em cima" do Header com `tailwind-scrollbar` */}
            <Header />
            {/* TODO: Loading between routes: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming */}
            <Suspense fallback={<Loading />}>
              <main className="h-full overflow-auto pt-16">{children}</main>
            </Suspense>
            {/* Descomentar para ativar o modal de WIP */}
            <div className="absolute inset-0 flex min-h-screen flex-col items-center justify-center px-4">
              <WorkInProgress />
            </div>
            <Analytics />
            <SpeedInsights />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// https://oauth.battle.net/oauth/authorize
// ?response_type=code
// &scope=openid%20wow.profile
// &state=MmY2YjM0NTE3ZTNhNDQ3M2JhNGQ3MDk2ZDkyZGU5MTg6dTdEUDV6RkxmdTFRem5uVHB4VFVIcGZ0eERaWHRlTjg%3D
// &redirect_uri=https%3A%2F%2Fv1cferr.dev%2Fapi%2Fblizzard%2Ftoken
// &client_id=b76eab86ac314f9480dfb7af5d19012a

// https://develop.battle.net/access/clients/b76eab86ac314f9480dfb7af5d19012a
// Changes made here may take up to 10 minutes to take effect.

// Esqueci de colocar https e não http...
