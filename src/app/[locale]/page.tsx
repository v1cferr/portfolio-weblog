import { Metadata } from "next";
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
  icons: { icon: IconType; title: string }[];
}

const IconGroup: React.FC<IconGroupProps> = ({ icons }) => (
  <div className="flex gap-3">
    {icons.map(({ icon: Icon, title }, index) => (
      <Icon
        key={index}
        size={30}
        title={title}
        className="hover:text-primary"
      />
    ))}
  </div>
);

interface IconContainerProps {
  title: string;
  icons: { icon: IconType; title: string }[];
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
      <section className="flex flex-col items-center gap-14 p-6">
        {/* Linguagens de Programação */}
        <IconContainer
          title="Linguagens"
          icons={[
            { icon: SiJavascript, title: "JavaScript" },
            { icon: SiTypescript, title: "TypeScript" },
            { icon: SiPython, title: "Python" },
          ]}
        />

        {/* Tecnologias */}
        <IconContainer
          title="Tecnologias"
          icons={[
            { icon: FaReact, title: "React" },
            { icon: SiNextdotjs, title: "Next.js" },
            { icon: FaNodeJs, title: "Node.js" },
            { icon: SiTailwindcss, title: "Tailwind CSS" },
            { icon: SiAstro, title: "Astro" },
            { icon: SiFastapi, title: "FastAPI" },
            { icon: SiVite, title: "Vite" },
          ]}
        />

        {/* Ferramentas */}
        <IconContainer
          title="Ferramentas"
          icons={[
            { icon: FaGitAlt, title: "Git" },
            { icon: FaGithub, title: "GitHub" },
            { icon: SiFigma, title: "Figma" },
            { icon: VscVscode, title: "VS Code" },
            { icon: VscTerminalBash, title: "Terminal" },
            { icon: FaDocker, title: "Docker" },
            { icon: SiSwagger, title: "Swagger" },
          ]}
        />
      </section>
    </>
  );
}
