"use client";

// Importações necessárias
import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import WorkInProgress from "@/components/WIP/WorkInProgress";
import Header from "@/components/Header";
import "@/styles/global.css";

// Configuração da fonte Inter do Google Fonts
const inter = Inter({ subsets: ["latin"] });

// Definição do componente ClientLayout
const ClientLayout = ({
  children,
  localeData,
}: {
  children: React.ReactNode;
  localeData: { locale: string; messages: any };
}) => {
  // Estado para controlar a visibilidade do componente WorkInProgress
  const [isWipVisible, setIsWipVisible] = useState(true);

  return (
    <html lang={localeData.locale} suppressHydrationWarning>
      <body
        className={`${inter.className} h-screen overflow-y-auto theme-transition`}>
        {/* Provedor de tema para gerenciar temas claros e escuros */}
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem={true}>
          {/* Provedor de internacionalização para gerenciar mensagens de localização */}
          <NextIntlClientProvider
            locale={localeData.locale}
            messages={localeData.messages}
            timeZone="UTC">
            {/* Componente de cabeçalho */}
            <Header />
            <div className="relative">
              {/* Conteúdo principal */}
              <main className="h-full pt-16 scrollbar-thin">{children}</main>
              {/* Componente de aviso de trabalho em progresso */}
              {isWipVisible && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  <WorkInProgress onClose={() => setIsWipVisible(false)} />
                </div>
              )}
            </div>
            {/* Análises e insights de velocidade */}
            <Analytics />
            <SpeedInsights />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

// Exportação do componente ClientLayout
export default ClientLayout;
