import Link from "next/link";
import {
  FaReact,
  FaNodeJs,
  FaGitAlt,
  FaGithub,
  FaDocker,
} from "react-icons/fa";
import { GrMysql } from "react-icons/gr";
import { PiFileSql } from "react-icons/pi";
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

import type { IconType } from "react-icons";

interface IIconGroupProps {
  icons: { icon: IconType; title: string; href: string }[];
}

const IconGroup: React.FC<IIconGroupProps> = ({ icons }) => (
  <div className="flex gap-3">
    {icons.map(({ icon: Icon, title, href }, index) => (
      <Link href={href} key={index} rel="noopener noreferrer" target="_blank">
        <Icon className="hover:text-primary" size={30} title={title} />
      </Link>
    ))}
  </div>
);

interface IIconContainerProps {
  title: string;
  icons: { icon: IconType; title: string; href: string }[];
}

const IconContainer: React.FC<IIconContainerProps> = ({ title, icons }) => (
  <div className="flex flex-col items-center gap-4">
    <h2 className="text-2xl font-semibold">{title}</h2>
    <IconGroup icons={icons} />
  </div>
);

/**
 *
 */
export default function TechIcons() {
  return (
    <section className="flex flex-col items-center gap-14 p-6">
      {/* Linguagens de Programação */}
      <IconContainer
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
        title="Linguagens"
      />

      {/* Tecnologias */}
      <IconContainer
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
        title="Tecnologias"
      />

      {/* Ferramentas */}
      <IconContainer
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
        title="Ferramentas"
      />
    </section>
  );
}
