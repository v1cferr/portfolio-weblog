import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup",
  description: "Configurações do meu setup/workstation",
};

/**
 *
 */
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>;
}
