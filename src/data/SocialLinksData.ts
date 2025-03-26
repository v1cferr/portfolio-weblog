import { FaGithub, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiMonkeytype, SiMinutemailer } from "react-icons/si";

export const socialLinks = [
  {
    href: "mailto:dev.victorferreira@gmail.com",
    icon: SiMinutemailer,
    title: "E-mail",
  },
  { href: "https://github.com/v1cferr", icon: FaGithub, title: "GitHub" },
  {
    href: "https://www.linkedin.com/in/v1cferr/",
    icon: FaLinkedin,
    title: "LinkedIn",
  },
  {
    href: "https://twitter.com/v1cferr",
    icon: FaXTwitter,
    title: "X/Twitter",
  },
  {
    href: "https://wa.me/5511980805097",
    icon: FaWhatsapp,
    title: "WhatsApp",
  },
  {
    href: "https://monkeytype.com/profile/v1cferr",
    icon: SiMonkeytype,
    title: "MonkeyType",
  },
  // { href: "https://hackmd.io/@v1cferr", icon: SiHackmd, title: "HackMD" },
  // { href: "https://cursos.alura.com.br/user/v1cferr", icon: SiAlura, title: "Alura" },
];
