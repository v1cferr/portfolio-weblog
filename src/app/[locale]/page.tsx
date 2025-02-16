// TODO: Componentizar a parte dos icones de tecnologia/conhecimentos
// (isso aqui tá uma bagunça)

import { Metadata } from "next";
import Link from "next/link";
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
  SiCss3,
  SiHtml5,
  SiSupabase,
} from "react-icons/si";
import { VscVscode, VscTerminalBash } from "react-icons/vsc";
import { IconType } from "react-icons";
import { PiFileSql } from "react-icons/pi";
import { GrMysql } from "react-icons/gr";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

interface IconGroupProps {
  icons: { icon: IconType; title: string; href: string }[];
}

const IconGroup: React.FC<IconGroupProps> = ({ icons }) => (
  <div className="flex gap-3">
    {icons.map(({ icon: Icon, title, href }, index) => (
      <Link key={index} href={href} target="_blank" rel="noopener noreferrer">
        <Icon size={30} title={title} className="hover:text-primary" />
      </Link>
    ))}
  </div>
);

interface IconContainerProps {
  title: string;
  icons: { icon: IconType; title: string; href: string }[];
}

const IconContainer: React.FC<IconContainerProps> = ({ title, icons }) => (
  <div className="flex flex-col items-center gap-3">
    <h2 className="text-2xl font-semibold">{title}</h2>
    <IconGroup icons={icons} />
  </div>
);

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Icon Section */}
      {/* TODO: Componentizar esses icones de tecnologia/conhecimentos (adicionar em outro modulo) */}
      <section className="flex flex-col items-center gap-14 p-6">
        {/* Linguagens de Programação */}
        <IconContainer
          title="Linguagens"
          icons={[
            {
              icon: SiJavascript,
              title: "JavaScript",
              href: "https://developer.mozilla.org/docs/Web/JavaScript",
            },
            {
              icon: SiTypescript,
              title: "TypeScript",
              href: "https://www.typescriptlang.org/",
            },
            {
              icon: SiPython,
              title: "Python",
              href: "https://www.python.org/",
            },
            {
              icon: SiHtml5,
              title: "HTML",
              href: "https://developer.mozilla.org/docs/Web/HTML",
            },
            {
              icon: SiCss3,
              title: "CSS",
              href: "https://developer.mozilla.org/docs/Web/CSS",
            },
            {
              icon: PiFileSql,
              title: "SQL",
              href: "https://www.w3schools.com/sql/",
            },
          ]}
        />

        {/* Tecnologias */}
        <IconContainer
          title="Tecnologias"
          icons={[
            { icon: FaReact, title: "React", href: "https://reactjs.org/" },
            {
              icon: SiNextdotjs,
              title: "Next.js",
              href: "https://nextjs.org/",
            },
            { icon: FaNodeJs, title: "Node.js", href: "https://nodejs.org/" },
            {
              icon: SiTailwindcss,
              title: "Tailwind CSS",
              href: "https://tailwindcss.com/",
            },
            { icon: SiAstro, title: "Astro", href: "https://astro.build/" },
            {
              icon: SiFastapi,
              title: "FastAPI",
              href: "https://fastapi.tiangolo.com/",
            },
            { icon: SiVite, title: "Vite", href: "https://vitejs.dev/" },
            { icon: GrMysql, title: "MySQL", href: "https://www.mysql.com/" },
          ]}
        />

        {/* Ferramentas */}
        <IconContainer
          title="Ferramentas"
          icons={[
            { icon: FaGitAlt, title: "Git", href: "https://git-scm.com/" },
            { icon: FaGithub, title: "GitHub", href: "https://github.com/" },
            { icon: SiFigma, title: "Figma", href: "https://www.figma.com/" },
            {
              icon: VscVscode,
              title: "VS Code",
              href: "https://code.visualstudio.com/",
            },
            {
              icon: VscTerminalBash,
              title: "Terminal",
              href: "https://www.gnu.org/software/bash/",
            },
            {
              icon: FaDocker,
              title: "Docker",
              href: "https://www.docker.com/",
            },
            { icon: SiSwagger, title: "Swagger", href: "https://swagger.io/" },
            {
              icon: SiSupabase,
              title: "Supabase",
              href: "https://supabase.io/",
            },
          ]}
        />
      </section>

      {/* Focos Atuais */}
      <section className="flex flex-col items-center text-center p-6 bg-base-200 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-primary">Foco Atual</h2>
        <p className="mt-2 text-base-content/80 max-w-md">
          Estou aprimorando minhas habilidades para me tornar um{" "}
          <strong>Engenheiro de IA</strong>, combinando desenvolvimento de
          software, aprendizado de máquina e segurança.
        </p>

        {/* Lista de objetivos */}
        <ul className="mt-4 space-y-2 text-base-content/90">
          <li className="flex items-center gap-2">
            ✅ Dominar frameworks de IA e aprendizado profundo
          </li>
          <li className="flex items-center gap-2">
            ✅ Aprofundar conhecimentos em segurança e escalabilidade
          </li>
          <li className="flex items-center gap-2">
            ✅ Criar projetos aplicando IA no desenvolvimento de software
          </li>
        </ul>

        {/* Botão para Roadmap */}
        <Link
          href="https://roadmap.sh/ai-engineer"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 btn btn-primary flex items-center gap-2 px-6">
          🔗 Explorar Roadmap de AI Engineer
        </Link>
      </section>

      {/* Computers are REALLY fast */}
      {/* https://youtu.be/cmshJmQ6o90 */}
      <section className="flex flex-col items-center text-center p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-primary mb-4">
          Computers are REALLY fast
        </h2>
        <blockquote className="text-sm italic text-base-content/80 max-w-2xl mb-6 border-l-4 border-primary pl-4 bg-base-200 p-4 rounded-md shadow-md hover:underline hover:cursor-pointer text-left">
          &quot;An updated version of the Fibonacci program I&apos;d written and
          shown in an earlier video; this time with changes by very clever folks
          on GitHub (Francesco146 and LizzyFleckenstein03) to take advantage of
          binary exponentiation. The result is absurdly fast, as we can very
          rapidly calculate the 100 millionth Fibonacci number: a number that
          contains roughly 20 million digits, and if printed to a file results
          in a twenty megabyte text file.&quot;
        </blockquote>
        <div className="relative w-full max-w-4xl overflow-hidden rounded-lg shadow-lg">
          <iframe
            className="w-full h-64 md:h-96"
            src="https://www.youtube.com/embed/cmshJmQ6o90"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>
    </>
  );
}
