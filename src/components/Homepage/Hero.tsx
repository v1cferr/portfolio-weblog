"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center px-6 py-16 md:py-24 lg:py-32 bg-base-200 text-base-content">
      {/* Nome e título */}
      <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
        Olá, sou Victor.
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl font-semibold text-primary">
        Software-AI Engineer in Progress
      </p>

      {/* Descrição */}
      <p className="mt-2 text-sm md:text-base max-w-md text-base-content">
        Explorando tecnologias modernas para construir soluções eficientes e
        acessíveis.
      </p>

      {/* Botões */}
      <div className="mt-6 flex flex-col gap-3 w-full max-w-xs sm:max-w-sm">
        <Link href="#projects" className="btn btn-primary w-full">
          Veja meus projetos
        </Link>
        <Link href="#contact" className="btn btn-outline w-full">
          Fale comigo
        </Link>
      </div>
    </section>
  );
}
