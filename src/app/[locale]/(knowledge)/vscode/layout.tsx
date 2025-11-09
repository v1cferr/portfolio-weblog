import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VSCode",
  description: "Extensões do Visual Studio Code",
};

export default function VSCodeLayout({ children }: { children: React.ReactNode }) {
  return <section>{children}</section>;
}
