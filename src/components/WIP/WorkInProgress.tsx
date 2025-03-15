import Link from "next/link";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { FaGithub, FaLinkedin, FaWhatsapp, FaTimes } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiMonkeytype, SiMinutemailer } from "react-icons/si";

import LanguageSelector from "@/components/i18n/LanguageSelector";
import Loading from "@/components/Loading";
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
 *
 */
function WorkInProgress({ onClose }: { onClose: () => void }) {
  const t = useTranslations("WorkInProgress");

  return (
    <>
      {/* Filtro para deixar tudo que tiver atrás desfocado e impedir cliques */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 pointer-events-none" />

      {/* Modal para sinalizar WIP */}
      <main className="fixed inset-0 flex items-center justify-center z-50 pointer-events-auto">
        <div className="flex flex-col items-center justify-center shadow-xl p-5 rounded-md bg-base-100 text-base-content">
          <div className="flex justify-between w-full items-center px-2 mb-10">
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <ThemeToggle />
            </div>
            <button
              className="text-xl font-bold hover:text-red-500 transition-colors duration-300"
              onClick={onClose}>
              <FaTimes size={25} />
            </button>
          </div>

          <div>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <div className="divider" />
          </div>

          <Suspense fallback={<Loading />}>
            <SpotifyPlayer />
          </Suspense>

          <div className="divider" />

          <div className="flex gap-5">
            {socialLinks.map(({ href, icon: Icon, title }) => (
              <Link
                className="hover:text-gray-600"
                href={href}
                key={title}
                rel="noopener noreferrer"
                target="_blank"
                title={title}>
                <Icon size={25} />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default WorkInProgress;
