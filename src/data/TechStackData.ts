import { FaReact, FaNodeJs, FaGitAlt, FaGithub, FaDocker } from "react-icons/fa";
import { GrMysql } from "react-icons/gr";
import { MdSecurity } from "react-icons/md";
import { PiFileSql } from "react-icons/pi";
import { RiGeminiFill } from "react-icons/ri";
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
  SiSecurityscorecard,
  SiOpenai,
  SiHuggingface,
  SiZap,
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
    title: "Linguagens de Programação e Marcação",
    description: "Linguagens essenciais que utilizo para desenvolvimento de software, web e documentação técnica.",
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
    title: "Frameworks e Bibliotecas",
    description: "Principais frameworks, bibliotecas e bancos de dados que utilizo para construir aplicações web modernas e eficientes.",
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
    title: "Ferramentas de Desenvolvimento e DevOps",
    description: "Ferramentas essenciais para otimizar o fluxo de desenvolvimento, colaboração, versionamento e implantação.",
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
        href: "https://github.com",
        color: "text-base-content",
      },
      {
        icon: FaDocker,
        title: "Docker",
        href: "https://www.docker.com/",
        color: "text-blue-500",
      },
      {
        icon: VscVscode,
        title: "VS Code",
        href: "https://code.visualstudio.com/",
        color: "text-blue-400",
      },
      {
        icon: SiFigma,
        title: "Figma",
        href: "https://www.figma.com/",
        color: "text-purple-500",
      },
      {
        icon: SiSwagger,
        title: "Swagger",
        href: "https://swagger.io/",
        color: "text-green-500",
      },
      {
        icon: VscTerminalBash,
        title: "Terminal (Bash/Zsh)",
        href: "https://www.gnu.org/software/bash/",
        color: "text-base-content",
      },
      {
        icon: SiSupabase,
        title: "Supabase",
        href: "https://supabase.io/",
        color: "text-green-600",
      },
    ],
  },
  {
    title: "Segurança de Aplicações (AppSec)",
    description:
      "Ferramentas para análise estática (SAST), dinâmica (DAST), de composição de software (SCA) e de contêineres, integradas ao ciclo de DevSecOps.",
    items: [
      {
        icon: MdSecurity,
        title: "Fortify on Demand",
        href: "https://www.microfocus.com/en-us/cyberres/application-security/fortify-on-demand",
        color: "text-red-500",
      },
      {
        icon: SiSecurityscorecard,
        title: "Sonatype Nexus",
        href: "https://www.sonatype.com/products/integrations",
        color: "text-blue-600",
      },
      {
        icon: SiZap,
        title: "OWASP ZAP",
        href: "https://www.zaproxy.org/",
        color: "text-green-600",
      },
    ],
  },
  {
    title: "Inteligência Artificial e LLMs",
    description:
      "Explorando a integração de modelos de linguagem e IA para criar soluções inovadoras e aprimorar a experiência do usuário.",
    items: [
      {
        icon: SiOpenai,
        title: "OpenAI API",
        href: "https://openai.com/api/",
        color: "text-base-content",
      },
      {
        icon: SiHuggingface,
        title: "Hugging Face",
        href: "https://huggingface.co/",
        color: "text-yellow-400",
      },
      {
        icon: RiGeminiFill,
        title: "Gemini API",
        href: "https://ai.google.dev/",
        color: "text-blue-500",
      },
    ],
  },
];
