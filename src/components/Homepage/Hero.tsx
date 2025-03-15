"use client";

import Image from "next/image";
import Link from "next/link";
import { FaBriefcase, FaLaptopCode } from "react-icons/fa";

import { socialLinks, quotes } from "@/data/HeroData";

import type { ISocialLinkProps, IQuoteCardProps } from "@/data/HeroData";

const SocialLink: React.FC<ISocialLinkProps> = ({ href, Icon, title }) => (
  <Link
    aria-label={title}
    className="text-base-content/70 hover:text-primary p-2 rounded-full hover:bg-base-200 transition-all duration-300"
    href={href}
    rel="noopener noreferrer"
    target="_blank">
    <Icon className="text-2xl" title={title} />
  </Link>
);

const QuoteCard: React.FC<IQuoteCardProps> = ({ quote, source, href }) => (
  <Link className="group" href={href} rel="noopener noreferrer" target="_blank">
    <div className="relative overflow-hidden rounded-lg border border-base-300 hover:border-primary transition-colors duration-300">
      <div className="absolute top-0 left-0 w-1 h-0 bg-gradient-to-b from-primary to-secondary group-hover:h-full transition-all duration-500" />
      <blockquote className="text-sm italic text-base-content/80 p-4 bg-base-100/50 hover:bg-base-100 transition-colors">
        &quot;{quote}&quot;
        <footer className="text-primary text-xs mt-2 flex items-center">
          <div className="w-4 h-0.5 bg-primary mr-2" />
          {source}
        </footer>
      </blockquote>
    </div>
  </Link>
);

/**
 *
 */
export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center px-6 py-16 bg-base-200/40 text-base-content md:flex-row md:justify-center md:items-start md:gap-12 max-w-7xl mx-auto">
      {/* Profile Picture with glow effect */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full opacity-60 blur-sm group-hover:opacity-100 transition duration-1000" />
        <div className="w-28 h-28 md:w-36 md:h-36 relative rounded-full overflow-hidden border-2 border-base-300 flex-shrink-0 z-10 group-hover:scale-105 transition-transform duration-500">
          <Image
            fill
            priority
            alt="v1cferr photo"
            className="rounded-full object-cover"
            sizes="(max-width: 768px) 100vw, (min-width: 768px) 50vw"
            src="/pictures/20240926085333.jpg"
          />
        </div>
      </div>

      {/* Conteúdo centralizado */}
      <div className="flex flex-col items-center text-center md:items-start md:text-left gap-y-4 flex-1 mt-6 md:mt-0">
        <div>
          <h1 className="text-3xl font-bold sm:text-3xl md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-base-content to-base-content/80">
            Oi, sou o Victor.
          </h1>
          <p className="text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-focus mt-1">
            Software-AI Engineer in Progress
          </p>
        </div>

        <p className="text-sm md:text-base max-w-md text-base-content/80 leading-relaxed">
          Desenvolvendo tecnologia com IA e segurança, sempre buscando
          eficiência, escalabilidade e aprimoramento contínuo.
        </p>

        {/* Ícones de redes sociais */}
        <div className="mt-2 flex space-x-2 justify-center md:justify-start">
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
        <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
          <Link
            className="btn btn-primary flex items-center gap-2 px-6 shadow-md hover:shadow-lg transition-shadow"
            href="/portfolio">
            <FaBriefcase className="text-lg" /> Ver Projetos
          </Link>

          <Link
            className="btn btn-outline border-primary/70 hover:border-primary flex items-center gap-2 px-6"
            href="/tech-stack">
            <FaLaptopCode className="text-lg" /> Tecnologias
          </Link>
        </div>

        {/* Quotes com design melhorado e componentizado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 w-full">
          {quotes.map((quote) => (
            <QuoteCard
              href={quote.href}
              key={quote.id}
              quote={quote.quote}
              source={quote.source}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
