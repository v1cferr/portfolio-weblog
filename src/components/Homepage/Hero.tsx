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
    <span className="sr-only">{title}</span>
  </Link>
);

const QuoteCard: React.FC<IQuoteCardProps> = ({ quote, source, href }) => (
  <article className="group relative overflow-hidden rounded-lg border border-base-300 hover:border-primary transition-colors duration-300">
    <div className="absolute top-0 left-0 w-1 h-0 bg-gradient-to-b from-primary to-secondary group-hover:h-full transition-all duration-500" />
    <blockquote className="text-sm italic text-base-content/80 p-4 bg-base-100/50 hover:bg-base-100 transition-colors">
      &quot;{quote}&quot;
      <footer className="text-primary text-xs mt-2 flex items-center">
        <div aria-hidden="true" className="w-4 h-0.5 bg-primary mr-2" />
        <cite>
          <Link
            className="group/link relative inline-block hover:text-primary transition-colors duration-300 pr-0.5"
            href={href}
            rel="noopener noreferrer"
            target="_blank">
            {source}
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover/link:w-full transition-all duration-300 ease-out"
            />
          </Link>
        </cite>
      </footer>
    </blockquote>
  </article>
);

/**
 * Hero component for the homepage
 */
export default function Hero() {
  return (
    <section
      aria-label="About Victor"
      className="w-full bg-base-200/40"
      id="hero-section">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center max-w-7xl mx-auto">
          {/* SECTION 1: Profile Picture with glow effect */}
          <header className="relative group mb-10 text-center">
            <div
              aria-hidden="true"
              className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full opacity-60 blur-sm group-hover:opacity-100 transition duration-1000"
            />
            <div className="w-28 h-28 md:w-36 md:h-36 relative rounded-full overflow-hidden border-2 border-base-300 flex-shrink-0 z-10 group-hover:scale-105 transition-transform duration-500">
              <Image
                fill
                priority
                alt="Victor Ferreira - Software-AI Engineer"
                className="rounded-full object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                src="/pictures/20240926085333.jpg"
              />
            </div>
          </header>

          {/* SECTION 2: Main content - Introduction, social, CTA */}
          <div className="text-center max-w-2xl mb-12">
            <div className="mb-6">
              <h1 className="text-3xl font-bold sm:text-3xl md:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-base-content to-base-content/80">
                Oi, sou o Victor.
              </h1>
              <p className="text-xl md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-focus mt-1">
                Software-AI Engineer in Progress
              </p>
            </div>

            <p className="text-sm md:text-base max-w-md mx-auto text-base-content/80 leading-relaxed mb-4">
              Desenvolvendo tecnologia com IA e segurança, sempre buscando
              eficiência, escalabilidade e aprimoramento contínuo.
            </p>

            {/* Social links */}
            <nav
              aria-label="Social Media Links"
              className="flex justify-center space-x-2 mb-6">
              {socialLinks.map((link) => (
                <SocialLink
                  Icon={link.Icon}
                  href={link.href}
                  key={link.title}
                  title={link.title}
                />
              ))}
            </nav>

            {/* Call-to-Action buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                className="btn btn-primary flex items-center gap-2 px-6 shadow-md hover:shadow-lg transition-shadow"
                href="/portfolio">
                <FaBriefcase aria-hidden="true" className="text-lg" />
                <span>Ver Projetos</span>
              </Link>

              <Link
                className="btn btn-outline border-primary/70 flex items-center gap-2 px-6"
                href="/tech-stack">
                <FaLaptopCode aria-hidden="true" className="text-lg" />
                <span>Tecnologias</span>
              </Link>
            </div>
          </div>

          {/* SECTION 3: Quote cards */}
          <section aria-labelledby="inspiring-quotes" className="w-full">
            <h2 className="sr-only" id="inspiring-quotes">
              Citações Inspiradoras
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {quotes.map((quote) => (
                <QuoteCard
                  href={quote.href}
                  key={quote.id}
                  quote={quote.quote}
                  source={quote.source}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
