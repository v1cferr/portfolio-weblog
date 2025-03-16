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
  SiPostgresql,
  SiMarkdown,
  SiLatex,
} from "react-icons/si";
import { VscVscode, VscTerminalBash } from "react-icons/vsc";

import type { IconType } from "react-icons";

interface ITechItem {
  icon: IconType;
  title: string;
  href: string;
  color?: string;
}

interface ICategoryData {
  title: string;
  description: string;
  items: ITechItem[];
}

export const categories: ICategoryData[] = [
  {
    title: "Linguagens",
    description: "Linguagens que utilizo no desenvolvimento e documentação",
    items: [
      {
        icon: SiJavascript,
        title: "JavaScript",
        href: "https://developer.mozilla.org/docs/Web/JavaScript",
        color: "text-yellow-400",
      },
      {
        icon: SiTypescript,
        title: "TypeScript",
        href: "https://www.typescriptlang.org/",
        color: "text-blue-500",
      },
      {
        icon: SiPython,
        title: "Python",
        href: "https://www.python.org/",
        color: "text-yellow-500",
      },
      {
        icon: SiHtml5,
        title: "HTML",
        href: "https://developer.mozilla.org/docs/Web/HTML",
        color: "text-orange-500",
      },
      {
        icon: SiCss3,
        title: "CSS",
        href: "https://developer.mozilla.org/docs/Web/CSS",
        color: "text-blue-400",
      },
      {
        icon: PiFileSql,
        title: "SQL",
        href: "https://www.w3schools.com/sql/",
        color: "text-blue-300",
      },
      {
        icon: SiMarkdown,
        title: "Markdown",
        href: "https://www.markdownguide.org/",
        color: "text-base-content",
      },
      {
        icon: SiLatex,
        title: "LaTeX",
        href: "https://www.latex-project.org/",
        color: "text-base-content",
      },
    ],
  },
  {
    title: "Tecnologias",
    description: "Frameworks e bibliotecas que uso para criar aplicações",
    items: [
      {
        icon: FaReact,
        title: "React",
        href: "https://reactjs.org/",
        color: "text-cyan-400",
      },
      {
        icon: SiNextdotjs,
        title: "Next.js",
        href: "https://nextjs.org/",
        color: "text-base-content",
      },
      {
        icon: FaNodeJs,
        title: "Node.js",
        href: "https://nodejs.org/",
        color: "text-green-500",
      },
      {
        icon: SiTailwindcss,
        title: "Tailwind CSS",
        href: "https://tailwindcss.com/",
        color: "text-cyan-500",
      },
      {
        icon: SiAstro,
        title: "Astro",
        href: "https://astro.build/",
        color: "text-orange-500",
      },
      {
        icon: SiFastapi,
        title: "FastAPI",
        href: "https://fastapi.tiangolo.com/",
        color: "text-teal-500",
      },
      {
        icon: SiVite,
        title: "Vite",
        href: "https://vitejs.dev/",
        color: "text-purple-500",
      },
      {
        icon: GrMysql,
        title: "MySQL",
        href: "https://www.mysql.com/",
        color: "text-blue-600",
      },
      {
        icon: SiPostgresql,
        title: "PostgreSQL",
        href: "https://www.postgresql.org/",
        color: "text-blue-600",
      },
    ],
  },
  {
    title: "Ferramentas",
    description: "Ferramentas que utilizo no meu fluxo de trabalho",
    items: [
      {
        icon: FaGitAlt,
        title: "Git",
        href: "https://git-scm.com/",
        color: "text-orange-600",
      },
      {
        icon: FaGithub,
        title: "GitHub",
        href: "https://github.com/",
        color: "text-base-content",
      },
      {
        icon: SiFigma,
        title: "Figma",
        href: "https://www.figma.com/",
        color: "text-purple-400",
      },
      {
        icon: VscVscode,
        title: "VS Code",
        href: "https://code.visualstudio.com/",
        color: "text-blue-500",
      },
      {
        icon: VscTerminalBash,
        title: "Terminal",
        href: "https://www.gnu.org/software/bash/",
        color: "text-base-content",
      },
      {
        icon: FaDocker,
        title: "Docker",
        href: "https://www.docker.com/",
        color: "text-blue-500",
      },
      {
        icon: SiSwagger,
        title: "Swagger",
        href: "https://swagger.io/",
        color: "text-green-500",
      },
      {
        icon: SiSupabase,
        title: "Supabase",
        href: "https://supabase.io/",
        color: "text-emerald-500",
      },
    ],
  },
];
