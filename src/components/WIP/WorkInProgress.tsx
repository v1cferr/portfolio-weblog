"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { FaGithub, FaLinkedin, FaWhatsapp, FaTimes } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiMonkeytype, SiMinutemailer } from "react-icons/si";

import LanguageSelector from "@/components/i18n/LanguageSelector";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import ThemeToggle from "@/components/ThemeToggle";

const socialLinks = [
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

/**
 * Componente Modal de Trabalho em Progresso
 *
 * Exibe um modal indicando que o site está em construção
 * com animações fornecidas pelo Framer Motion.
 */
function WorkInProgress({ onClose }: { onClose: () => void }) {
  const t = useTranslations("WorkInProgress");

  // Previne a rolagem quando o modal está aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <motion.div
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      {/* Modal Content */}
      <motion.div
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md mx-auto"
        exit={{ scale: 0.9, opacity: 0 }}
        initial={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}>
        <div className="card overflow-hidden rounded-xl shadow-2xl border-0 bg-gradient-to-b from-base-100 to-base-100/80 backdrop-blur-sm">
          {/* Card Header */}
          <div className="flex flex-row items-center justify-between p-4 border-b-base-200 bg-base-200/60">
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <div className="h-6 w-px bg-base-content/20" />
              <ThemeToggle />
            </div>
            <motion.button
              className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}>
              <FaTimes size={16} />
              <span className="sr-only">Close</span>
            </motion.button>
          </div>

          {/* Card Content */}
          <div className="p-8 space-y-8">
            <motion.div
              animate={{ y: 0, opacity: 1 }}
              className="space-y-2 text-center"
              initial={{ y: -20, opacity: 0 }}
              transition={{ delay: 0.1 }}>
              <div className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-2">
                🚧 Under Construction
              </div>
              <h2 className="text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t("title")}
              </h2>
              <p className="text-base-content/70 text-sm max-w-xs mx-auto">
                Estou construindo meu personal hub (portfólio e weblog). Algumas
                páginas podem não estar disponíveis ou finalizadas.
              </p>
              <p className="text-xs text-base-content/50 mt-2">
                Você pode fechar esse modal e explorar as áreas disponíveis.
              </p>
            </motion.div>

            {/* Spotify Player */}
            <SpotifyPlayer />

            {/* Social Links */}
            <motion.div
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4"
              initial={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.3 }}>
              <h3 className="text-sm font-medium text-center">
                {/* TODO: Alterar para i18n posteriormente */}
                Conecte-se comigo
              </h3>
              <div className="flex justify-center space-x-3">
                {socialLinks.map(({ href, icon: Icon, title }) => (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.8 }}
                    key={title}
                    whileHover={{ y: -2.5, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}>
                    <Link
                      className="flex items-center justify-center p-3 rounded-full bg-primary/10 hover:bg-primary/20 hover:shadow-md transition-all duration-200"
                      href={href}
                      rel="noopener noreferrer"
                      target="_blank"
                      title={title}>
                      <Icon
                        className="text-base-content/80 group-hover:text-primary"
                        size={18}
                      />
                      <span className="sr-only">{title}</span>
                    </Link>
                    <motion.span
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}>
                      {title}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default WorkInProgress;
