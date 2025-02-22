import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import ClientLayout from "@/components/Homepage/ClientLayout";
import "@/styles/global.css";

// Configuração da fonte Inter do Google Fonts
const inter = Inter({ subsets: ["latin"] });

// Configuração do viewport
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Metadados da página
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

// Função para buscar dados de localização
async function fetchLocaleData(params: Promise<{ locale: string }>) {
  const { locale } = await params;

  // Verifica se o locale está incluído nas rotas permitidas
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Busca as mensagens de localização
  const messages = await getMessages();

  return { locale, messages };
}

// Componente principal do layout da página
export default async function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Busca os dados de localização
  const localeData = await fetchLocaleData(params);

  // Renderiza o layout do cliente com os dados de localização
  return <ClientLayout localeData={localeData}>{children}</ClientLayout>;
}
