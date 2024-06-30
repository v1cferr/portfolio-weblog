import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
// import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "v1cferr - title",
  description: "v1cferr - description",
  keywords: ["v1cferr", "spotify", "nextjs", "tailwindcss"],
  authors: [{ name: "v1cferr", url: "https://github.com/v1cferr" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          {/* TODO: make a sidebar */}
          {/* <Sidebar /> */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
