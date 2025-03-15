import { FaGithub, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiMinutemailer } from "react-icons/si";

export interface ISocialLinkProps {
  href: string;
  Icon: React.ComponentType<{ className?: string; title?: string }>;
  title: string;
}

export const socialLinks = [
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

export interface IQuoteCardProps {
  quote: string;
  source: string;
  href: string;
}

export const quotes = [
  {
    id: 1,
    quote:
      "Peçam, e lhes será dado; busquem, e encontrarão; batam, e a porta será aberta.",
    source: "Mateus 7:7",
    href: "https://www.bibliaonline.com.br/nvi/mt/7/7",
  },
  {
    id: 2,
    quote: "Não tenha medo de crescer lentamente, tenha medo de ficar parado.",
    source: "Provérbio Chinês",
    href: "https://www.pensador.com/frase/NDA2NjE4/",
  },
  {
    id: 3,
    quote: "Uma jornada de mil milhas começa com um único passo.",
    source: "Lao Tzu",
    href: "https://wikipedia.org/wiki/A_journey_of_a_thousand_miles_begins_with_a_single_step",
  },
];
