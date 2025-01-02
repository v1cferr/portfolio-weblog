import { Metadata } from "next";
import WorkInProgress from "@/components/WIP/WorkInProgress";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

export default function Home() {
  return (
    // Descomentar para ativar o modal de WIP
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <WorkInProgress />
    </div>

    // Apenas uma div para a Homepage ser válida
    // <div></div>
  );
}
