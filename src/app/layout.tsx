import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/tailwind.css";
import { ThemeProvider } from "next-themes";

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
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
