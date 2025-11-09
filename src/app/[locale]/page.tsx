import Link from "next/link";

import Hero from "@/components/Homepage/Hero";
import TechStack from "@/components/Homepage/TechStack";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

/**
 *
 */
export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Icon Section */}
      <TechStack />

      {/* Focos Atuais */}
      <section className="flex flex-col items-center text-center p-6 bg-base-200/40 rounded-lg">
        <h2 className="text-3xl font-bold text-primary">Foco Atual</h2>
        <p className="mt-2 text-base-content/80 max-w-md">
          Estou aprimorando minhas habilidades para me tornar um <strong>Engenheiro de IA</strong>, combinando desenvolvimento de software,
          aprendizado de máquina e segurança.
        </p>

        {/* Lista de objetivos */}
        <ul className="mt-4 space-y-2 text-base-content/90">
          <li className="flex items-center gap-2">✅ Dominar frameworks de IA e aprendizado profundo</li>
          <li className="flex items-center gap-2">✅ Aprofundar conhecimentos em segurança e escalabilidade</li>
          <li className="flex items-center gap-2">✅ Criar projetos aplicando IA no desenvolvimento de software</li>
        </ul>

        {/* Botão para Roadmap */}
        <Link
          className="mt-6 btn btn-primary flex items-center gap-2 px-6"
          href="https://roadmap.sh/ai-engineer"
          rel="noopener noreferrer"
          target="_blank"
        >
          🔗 Explorar Roadmap de AI Engineer
        </Link>
      </section>

      {/* Computers are REALLY fast */}
      {/* https://youtu.be/cmshJmQ6o90 */}
      <section className="flex flex-col items-center text-center p-6 rounded-lg gap-y-6">
        <h2 className="text-3xl font-bold text-primary">Computers are REALLY fast</h2>
        <div className="relative w-full max-w-4xl overflow-hidden rounded-lg shadow-lg">
          <iframe
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="w-full h-64 md:h-96"
            src="https://www.youtube.com/embed/cmshJmQ6o90"
            title="YouTube video player"
          />
        </div>
        <blockquote className="text-sm italic text-base-content/80 max-w-2xl border-l-4 border-primary pl-4 bg-base-200 p-4 rounded-md shadow-md text-left">
          &quot;An updated version of the Fibonacci program I&apos;d written and shown in an earlier video; this time with changes by very
          clever folks on GitHub (Francesco146 and LizzyFleckenstein03) to take advantage of binary exponentiation. The result is absurdly
          fast, as we can very rapidly calculate the 100 millionth Fibonacci number: a number that contains roughly 20 million digits, and
          if printed to a file results in a twenty megabyte text file.&quot;
        </blockquote>
      </section>
    </>
  );
}
