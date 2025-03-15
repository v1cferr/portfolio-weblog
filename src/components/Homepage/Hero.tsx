"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FaGithub,
  FaLinkedin,
  FaFileDownload,
  FaWhatsapp,
  // FaBriefcase,
  // FaDownload,
  // FaEnvelope,
  // FaBlog,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiMinutemailer } from "react-icons/si";

interface ISocialLinkProps {
  href: string;
  Icon: React.ComponentType<{ className?: string; title?: string }>;
  title: string;
}

const SocialLink: React.FC<ISocialLinkProps> = ({ href, Icon, title }) => (
  <Link href={href} rel="noopener noreferrer" target="_blank">
    <Icon
      className="text-2xl text-base-content hover:text-primary"
      title={title}
    />
  </Link>
);

const socialLinks = [
  { href: "https://github.com/v1cferr", Icon: FaGithub, title: "GitHub" },
  {
    href: "https://linkedin.com/in/v1cferr",
    Icon: FaLinkedin,
    title: "LinkedIn",
  },
  {
    href: "https://twitter.com/v1cferr",
    Icon: FaXTwitter,
    title: "X/Twitter",
  },
  {
    href: "https://wa.me/5511980805097",
    Icon: FaWhatsapp,
    title: "WhatsApp",
  },
  {
    href: "mailto:dev.victorferreira@gmail.com",
    Icon: SiMinutemailer,
    title: "Email",
  },
];

/**
 *
 */
export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center px-6 py-16 bg-base-200/40 text-base-content md:flex-row md:justify-center md:items-start md:gap-8">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary flex items-center justify-center mb-4 md:mb-0 md:mr-8">
        <Image
          priority
          alt="v1cferr photo"
          className="rounded-full w-full h-full"
          height={2312}
          src="/pictures/20240926085333.jpg"
          width={2312}
        />
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
          {/* TODO: Adicionar os icones das redes sociais em baixo do avatar de perfil em telas maiores */}
          {socialLinks.map((link) => (
            <SocialLink
              Icon={link.Icon}
              href={link.href}
              key={link.title}
              title={link.title}
            />
          ))}
        </div>

        {/* Buttons Call-to-Action */}
        <div className="mt-4 flex flex-col items-center gap-4">
          {/* <Link
            // TODO: Atualizar link do CV
            href="https://docs.google.com"
            className="btn btn-outline flex items-center gap-2 px-6"
            target="_blank"
            rel="noopener noreferrer"
            title="Baixar CV"> */}
          <button
            className="btn btn-outline flex items-center gap-2 px-6"
            onClick={() => window.alert("Work in progress!")}>
            <FaFileDownload size={20} /> Baixar CV
          </button>
          {/* </Link> */}

          {/* <Link
            href="/portfolio"
            className="btn btn-primary flex items-center gap-2 px-6">
            <FaBriefcase className="text-lg" /> Ver Meu Portfólio
          </Link> */}

          {/* <Link
            href="https://wa.me/5511980805097"
            className="btn btn-secondary flex items-center gap-2 px-6">
            <FaEnvelope className="text-lg" /> Entre em Contato
          </Link>

          <Link
            href="/blog"
            className="btn btn-accent flex items-center gap-2 px-6">
            <FaBlog className="text-lg" /> Últimos Artigos
          </Link> */}
        </div>

        {/* Quotes */}
        <div className="flex flex-col mt-4 space-y-2 max-w-xs md:max-w-3xl gap-2">
          <Link
            href="https://kultivi.com/blog/idiomas/dez-proverbios-chineses-e-seus-significados"
            rel="noopener noreferrer"
            target="_blank">
            <blockquote className="text-sm italic text-base-content/70 border-l-4 border-primary pl-4 bg-base-100 p-4 rounded-md shadow-md hover:underline hover:cursor-pointer text-left">
              &quot;Não tenha medo de crescer lentamente, tenha medo de ficar
              parado.&quot;
            </blockquote>
          </Link>
          <Link
            href="https://wikipedia.org/wiki/A_journey_of_a_thousand_miles_begins_with_a_single_step"
            rel="noopener noreferrer"
            target="_blank">
            <blockquote className="text-sm italic text-base-content/70 border-l-4 border-primary pl-4 bg-base-100 p-4 rounded-md shadow-md hover:underline hover:cursor-pointer text-left">
              &quot;Uma jornada de mil milhas começa com um único passo.&quot;
            </blockquote>
          </Link>
        </div>
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
