import { Suspense } from "react";
import { FaGithub, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { SiMonkeytype, SiMinutemailer } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import { useTranslations } from "next-intl";
import Link from "next/link";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import Loading from "@/components/Loading";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/i18n/LanguageSelector";

function WorkInProgress() {
  const t = useTranslations("WorkInProgress");

  const socialLinks = [
    {
      href: "mailto:dev.victorferreira@gmail.com",
      icon: SiMinutemailer,
      title: t("email"),
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

  return (
    <>
      {/* Filtro para deixar tudo que tiver atrás desfocado */}
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50"></div>

      {/* Modal para sinalizar WIP */}
      <main className="flex flex-col items-center justify-center shadow-xl p-5 rounded-md bg-base-100 text-base-content z-50">
        <div className="flex justify-between w-full items-center px-2 mb-10">
          <LanguageSelector />
          <ThemeToggle />
        </div>

        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <div className="divider" />
        </div>

        <Suspense fallback={<Loading />}>
          <SpotifyPlayer />
        </Suspense>

        <div className="divider" />

        <div className="flex gap-5">
          {socialLinks.map(({ href, icon: Icon, title }, index) => (
            <Link
              key={index}
              href={href}
              title={title}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600">
              <Icon size={25} />
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export default WorkInProgress;
