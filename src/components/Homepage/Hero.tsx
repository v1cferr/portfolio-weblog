"use client";

import Link from "next/link";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaFileDownload,
} from "react-icons/fa";

interface SocialLinkProps {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const SocialLink: React.FC<SocialLinkProps> = ({ href, Icon }) => (
  <Link href={href} target="_blank" rel="noopener noreferrer">
    <Icon className="text-2xl text-base-content hover:text-primary" />
  </Link>
);

// TODO: Adicionar o title para acessibilidade
const socialLinks = [
  { href: "https://github.com/yourusername", Icon: FaGithub },
  { href: "https://linkedin.com/in/yourusername", Icon: FaLinkedin },
  { href: "https://twitter.com/yourusername", Icon: FaTwitter },
  { href: "mailto:dev.victorferreira@gmail.com", Icon: FaEnvelope },
  { href: "https://docs.google.com/your-cv-link", Icon: FaFileDownload },
];

export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center px-6 py-16 bg-base-200 text-base-content">
      {/* Nome e título */}
      <h1 className="text-2xl font-bold sm:text-3xl md:text-4xl">
        Oi, sou o Victor.
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl font-semibold text-primary">
        Software-AI Engineer in Progress
      </p>

      {/* Descrição */}
      <p className="mt-2 text-sm md:text-base max-w-md text-base-content">
        Desenvolvedor e entusiasta de IA e cibersegurança. Focado em criar
        soluções performáticas, seguras e escaláveis.
      </p>

      {/* Ícones de redes sociais */}
      <div className="mt-4 flex space-x-4">
        {socialLinks.map((link, index) => (
          <SocialLink key={index} href={link.href} Icon={link.Icon} />
        ))}
      </div>
    </section>
  );
}

// ### 1️⃣ **Tech Stack & Skills**
// - Ícones das tecnologias que domino (Next.js, TypeScript, Python, etc.).
// - Um breve texto como *"Construindo soluções com essas tecnologias:"*.

// ### 2️⃣ **Experiência & Projetos**
// - Um pequeno destaque para principais projetos (com links).
// - Algo como *"Alguns dos projetos que desenvolvi e contribuí:"*.

// ### 3️⃣ **Resumo do Blog / Últimos Posts**
// - Um preview dos últimos artigos/postagens sobre tecnologia e IA.
// - Título tipo *"Últimos artigos no blog"*.
