"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import React, { useState, useEffect } from "react";

import Header from "@/components/Header";
import WorkInProgress from "@/components/WIP/WorkInProgress";

import type { AbstractIntlMessages } from "next-intl";
import "@/styles/global.css";

// Configuração da fonte Inter do Google Fonts
const inter = Inter({ subsets: ["latin"] });

// Definição do componente ClientLayout
const ClientLayout = ({
  children,
  localeData,
}: {
  children: React.ReactNode;
  localeData: { locale: string; messages: AbstractIntlMessages };
}) => {
  // Estado para controlar a visibilidade do componente WorkInProgress
  const [isWipVisible, setIsWipVisible] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  // Exibe o conteúdo principal com um pequeno atraso para garantir que o modal seja renderizado primeiro
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 100); // Atraso de 100ms para priorizar o modal
    return () => clearTimeout(timer);
  }, []);

  return (
    <html suppressHydrationWarning lang={localeData.locale}>
      <body
        className={`${inter.className} h-screen overflow-y-auto theme-transition`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem={true}>
          <NextIntlClientProvider
            locale={localeData.locale}
            messages={localeData.messages}
            timeZone="UTC">
            {/* Modal WorkInProgress - Renderizado primeiro */}
            {isWipVisible && (
              <div className="fixed inset-0 flex items-center justify-center z-[100] m-5">
                <WorkInProgress onClose={() => setIsWipVisible(false)} />
              </div>
            )}

            {/* Conteúdo principal controlado por visibilidade condicional */}
            <div
              className={
                contentVisible
                  ? "opacity-100 transition-opacity duration-300"
                  : "opacity-0"
              }>
              <Header />
              <main className="h-full pt-16 scrollbar-thin">{children}</main>
            </div>

            {/* Ferramentas de análise e insights */}
            <Analytics />
            <SpeedInsights />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ClientLayout;
