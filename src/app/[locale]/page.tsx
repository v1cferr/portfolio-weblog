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
import { IconType } from "react-icons";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

interface IconGroupProps {
  icons: IconType[];
}

const IconGroup: React.FC<IconGroupProps> = ({ icons }) => (
  <div className="flex gap-3">
    {icons.map((Icon, index) => (
      <Icon key={index} size={30} />
    ))}
  </div>
);

interface IconContainerProps {
  title: string;
  icons: IconType[];
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
      <section className="flex flex-col items-center gap-14 mt-6">
        {/* Linguagens de Programação */}
        <IconContainer
          title="Linguagens"
          icons={[SiJavascript, SiTypescript, SiPython]}
        />

        {/* Tecnologias */}
        <IconContainer
          title="Tecnologias"
          icons={[
            FaReact,
            SiNextdotjs,
            FaNodeJs,
            SiTailwindcss,
            SiAstro,
            SiFastapi,
            SiVite,
          ]}
        />

        {/* Ferramentas */}
        <IconContainer
          title="Ferramentas"
          icons={[
            FaGitAlt,
            FaGithub,
            SiFigma,
            VscVscode,
            VscTerminalBash,
            FaDocker,
            SiSwagger,
          ]}
        />
      </section>
    </>
  );
}
