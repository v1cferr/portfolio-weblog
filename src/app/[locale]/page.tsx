import { Metadata } from "next";
// import Link from "next/link";
import Hero from "@/components/Homepage/Hero";
import {
  FaReact,
  FaNodeJs,
  FaGitAlt,
  FaGithub,
  FaDocker,
} from "react-icons/fa";
import {
  SiTypescript,
  SiNextdotjs,
  SiTailwindcss,
  SiFigma,
  SiPython,
  SiAstro,
  SiFastapi,
  SiVite,
  SiSwagger,
  SiJavascript,
} from "react-icons/si";
import { VscVscode, VscTerminalBash } from "react-icons/vsc";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Linguagens de Programação */}
      <section className="flex flex-col items-center gap-6 mt-6">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-semibold">Linguagens</h2>
          <div className="flex gap-3">
            <SiJavascript size={30} />
            <SiTypescript size={30} />
            <SiPython size={30} />
          </div>
        </div>
      </section>

      {/* Tecnologias e Ferramentas */}
      <section className="flex flex-col items-center gap-6 mt-6">
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-semibold">Tecnologias</h2>
          <div className="flex gap-3">
            <FaReact size={30} />
            <SiNextdotjs size={30} />
            <FaNodeJs size={30} />
            <SiTailwindcss size={30} />
            <SiAstro size={30} />
            <SiFastapi size={30} />
            <SiVite size={30} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-semibold">Ferramentas</h2>
          <div className="flex gap-3">
            <FaGitAlt size={30} />
            <FaGithub size={30} />
            <SiFigma size={30} />
            <VscVscode size={30} />
            <VscTerminalBash size={30} />
            <FaDocker size={30} />
            <SiSwagger size={30} />
          </div>
        </div>
      </section>
    </>
  );
}
