"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import React, { useState, useEffect, useCallback, memo } from "react";

import Header from "@/components/Header";
import WorkInProgress from "@/components/WIP/WorkInProgress";

import type { AbstractIntlMessages } from "next-intl";
import "@/styles/global.css";

// Configuração da fonte
const inter = Inter({ subsets: ["latin"] });

// Tipos para as props
type ClientLayoutProps = {
  children: React.ReactNode;
  localeData: {
    locale: string;
    messages: AbstractIntlMessages;
  };
};

// Componente de modal WIP - extraído para melhor organização
const WIPModal = memo(({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 flex items-center justify-center z-[100] m-5">
    <WorkInProgress onClose={onClose} />
  </div>
));
WIPModal.displayName = "WIPModal";

// Conteúdo principal do layout
const PageContent = memo(({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) => (
  <div className={isVisible ? "opacity-100 transition-opacity duration-300" : "opacity-0"}>
    <Header />
    <main className="h-full pt-16 scrollbar-thin">{children}</main>
  </div>
));
PageContent.displayName = "PageContent";

// Componente principal do layout
const ClientLayout = ({ children, localeData }: ClientLayoutProps) => {
  const [isWipVisible, setIsWipVisible] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  // Manipula o fechamento do modal WIP
  const handleWipClose = useCallback(() => {
    setIsWipVisible(false);
  }, []);

  // Exibe o conteúdo com efeito de fade in após um pequeno atraso
  useEffect(() => {
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html suppressHydrationWarning lang={localeData.locale}>
      <body className={`${inter.className} h-screen overflow-y-auto theme-transition`}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem={true}>
          <NextIntlClientProvider locale={localeData.locale} messages={localeData.messages} timeZone="UTC">
            {/* Modal WIP renderizado condicionalmente */}
            {isWipVisible && <WIPModal onClose={handleWipClose} />}

            {/* Conteúdo principal */}
            <PageContent isVisible={contentVisible}>{children}</PageContent>

            {/* Ferramentas de análise */}
            <Analytics />
            <SpeedInsights />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default ClientLayout;
