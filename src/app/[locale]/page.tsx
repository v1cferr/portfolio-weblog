import { Metadata } from "next";
// import Link from "next/link";
import Hero from "@/components/Homepage/Hero";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

export default function Home() {
  return (
    <>
      <Hero />

      {/* Tecnologias */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold">Tecnologias</h2>
          <p>
            Aqui estão algumas das tecnologias que eu uso para desenvolver
            projetos.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold">Ferramentas</h2>
          <p>
            Aqui estão algumas das ferramentas que eu uso para desenvolver
            projetos.
          </p>
        </div>
      </section>

      {/* Sobre */}

      {/* Botões */}
      {/* <div className="mt-6 flex flex-col gap-3 w-full max-w-xs sm:max-w-sm">
        <Link href="#projects" className="btn btn-primary w-full">
          Veja meus projetos
        </Link>
        <Link href="#contact" className="btn btn-outline w-full">
          Fale comigo
        </Link>
      </div> */}
    </>
  );
}
