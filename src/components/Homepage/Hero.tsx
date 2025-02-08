"use client";

import Link from "next/link";
import {
  FaGithub,
  FaLinkedin,
  FaEnvelope,
  FaFileDownload,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

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
  { href: "https://twitter.com/yourusername", Icon: FaXTwitter },
  { href: "mailto:dev.victorferreira@gmail.com", Icon: FaEnvelope },
  { href: "https://docs.google.com/your-cv-link", Icon: FaFileDownload },
];

export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center px-6 py-16 bg-base-200 text-base-content md:flex-row md:justify-center md:items-start md:gap-8">
      {/* Moldura para imagem futura */}
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary flex items-center justify-center mb-4 md:mb-0 md:mr-8">
        {/* Substituir pelo <Image src="imagem.jpg" className="rounded-full w-full h-full" /> no futuro */}
      </div>

      {/* Conteúdo centralizado */}
      <div className="flex flex-col items-center text-center md:items-start md:text-left gap-y-2">
        <h1 className="text-3xl font-bold sm:text-3xl md:text-4xl">
          Oi, sou o Victor.
        </h1>
        <p className="text-xl md:text-2xl font-semibold text-primary">
          Software-AI Engineer in Progress
        </p>

        <p className="mt-2 text-sm md:text-base max-w-md text-base-content">
          Desenvolvendo tecnologia com IA e segurança, sempre buscando
          eficiência, escalabilidade e aprimoramento contínuo.
        </p>

        {/* Ícones de redes sociais */}
        <div className="mt-4 flex space-x-4">
          {socialLinks.map((link, index) => (
            <SocialLink key={index} href={link.href} Icon={link.Icon} />
          ))}
        </div>

        {/* Quotes */}
        {/* TODO: Estilizar como os quotes do HackMD */}

        {/* https://kultivi.com/blog/idiomas/dez-proverbios-chineses-e-seus-significados */}
        <blockquote className="mt-4 text-sm italic text-base-content/70 max-w-sm">
          &quot;Não tenha medo de crescer lentamente, tenha medo de ficar
          parado.&quot;
        </blockquote>

        {/* https://en.m.wikipedia.org/wiki/A_journey_of_a_thousand_miles_begins_with_a_single_step */}
        <blockquote className="mt-2 text-sm italic text-base-content/70 max-w-sm">
          &quot;Uma jornada de mil milhas começa com um único passo.&quot;
        </blockquote>
      </div>
    </section>
  );
}

// ### 2️⃣ **Experiência & Projetos**
// - Um pequeno destaque para principais projetos (com links).
// - Algo como *"Alguns dos projetos que desenvolvi e contribuí:"*.

// ### 3️⃣ **Resumo do Blog / Últimos Posts**
// - Um preview dos últimos artigos/postagens sobre tecnologia e IA.
// - Título tipo *"Últimos artigos no blog"*.
