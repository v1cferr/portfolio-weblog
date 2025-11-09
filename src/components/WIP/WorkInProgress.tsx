"use client";

import { FocusTrap } from "focus-trap-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useCallback, memo } from "react";
import { FaTimes } from "react-icons/fa";

import LanguageSelector from "@/components/i18n/LanguageSelector";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import ThemeToggle from "@/components/ThemeToggle";
import { socialLinks } from "@/data/SocialLinksData";

/**
 * Componente de Backdrop com Blur
 *
 * Exibe um fundo escuro com efeito de desfoque para o modal
 * com animação de fade in/out. Não fecha o modal ao clicar.
 */
const ModalBackdrop = memo(() => (
  <motion.div
    animate={{ opacity: 1 }}
    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
    exit={{ opacity: 0 }}
    initial={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  />
));
ModalBackdrop.displayName = "ModalBackdrop";

/**
 * Componente de Cabeçalho do Modal
 *
 * Exibe os controles superiores do modal (idioma, tema e botão de fechar)
 * O botão X é a única forma visual de fechar o modal.
 */
const ModalHeader = memo(({ onClose }: { onClose: () => void }) => (
  <header className="flex flex-row items-center justify-between p-4 border-b-base-200 bg-base-200/60">
    <div className="flex items-center gap-3">
      <LanguageSelector />
      <div className="h-6 w-px bg-base-content/20" />
      <ThemeToggle />
    </div>
    <motion.button
      aria-label="Fechar modal"
      className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClose}
    >
      <FaTimes size={16} />
      <span className="sr-only">Fechar</span>
    </motion.button>
  </header>
));
ModalHeader.displayName = "ModalHeader";

/**
 * Componente de Conteúdo do Modal
 *
 * Exibe o conteúdo principal do modal com o título e descrição
 */
const ModalContent = memo(() => {
  const t = useTranslations("WorkInProgress");

  return (
    <motion.section
      animate={{ y: 0, opacity: 1 }}
      className="space-y-2 text-center"
      initial={{ y: -20, opacity: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary mb-2">{t("badge")}</div>
      <h1
        className="text-center text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        id="work-in-progress-title"
      >
        {t("title")}
      </h1>
      <p className="text-base-content/70 text-sm max-w-xs mx-auto">{t("description")}</p>
      <p className="text-xs text-base-content/50 mt-2">{t("cta")}</p>
    </motion.section>
  );
});
ModalContent.displayName = "ModalContent";

/**
 * Componente de Links Sociais
 *
 * Exibe os links para redes sociais com animações
 */
const SocialLinks = memo(() => {
  const t = useTranslations("WorkInProgress");

  return (
    <motion.section
      animate={{ y: 0, opacity: 1 }}
      aria-labelledby="connect-with-me"
      className="space-y-4"
      initial={{ y: 20, opacity: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-sm font-medium text-center" id="connect-with-me">
        {t("connect")}
      </h2>
      <nav aria-label="Links para redes sociais" className="flex justify-center space-x-3">
        {socialLinks.map(({ href, icon: Icon, title }) => (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="relative group"
            initial={{ opacity: 0, scale: 0.8 }}
            key={title}
            whileHover={{ y: -2.5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              aria-label={title}
              className="flex items-center justify-center p-3 rounded-full bg-base-content/5 hover:shadow-md transition-all duration-200"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
              title={title}
            >
              <Icon className="text-base-content/85 group-hover:text-primary" size={18} />
              <span className="sr-only">{title}</span>
            </Link>
          </motion.div>
        ))}
      </nav>
    </motion.section>
  );
});
SocialLinks.displayName = "SocialLinks";

/**
 * Componente Modal de Trabalho em Progresso
 *
 * Exibe um modal indicando que o site está em construção
 * com animações fornecidas pelo Framer Motion. O componente
 * implementa práticas de acessibilidade como trap focus e
 * tratamento de tecla Escape.
 *
 * O modal só pode ser fechado pelo botão X ou pela tecla Escape.
 *
 * @param {Function} onClose - Função chamada quando o modal é fechado
 */
function WorkInProgress({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Previne a rolagem quando o modal está aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Função de limpeza para restaurar o comportamento normal
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Manipulador para tecla Escape
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Adiciona event listener para tecla Escape
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Define variantes de animação para o conteúdo do modal
  const modalContentVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    exit: { scale: 0.9, opacity: 0 },
  };

  return (
    <FocusTrap>
      <div
        aria-labelledby="work-in-progress-title"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0"
        ref={modalRef}
        role="dialog"
      >
        {/* Backdrop com blur (sem onClick para fechar) */}
        <ModalBackdrop />

        {/* Conteúdo do Modal */}
        <motion.div
          animate="visible"
          className="relative z-10 w-full max-w-md mx-auto"
          exit="exit"
          initial="hidden"
          variants={modalContentVariants}
        >
          <article className="card overflow-hidden rounded-xl shadow-2xl border-0 bg-gradient-to-b from-base-100 to-base-100/80 backdrop-blur-sm">
            {/* Cabeçalho do Card */}
            <ModalHeader onClose={onClose} />

            {/* Conteúdo do Card */}
            <main className="p-6 md:p-8 space-y-6 md:space-y-8">
              {/* Seção de título e descrição */}
              <ModalContent />

              {/* Player do Spotify */}
              <section aria-label="Player do Spotify">
                <SpotifyPlayer />
              </section>

              {/* Links Sociais */}
              <SocialLinks />
            </main>
          </article>
        </motion.div>
      </div>
    </FocusTrap>
  );
}

export default WorkInProgress;
