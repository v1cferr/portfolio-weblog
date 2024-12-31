import { Suspense } from "react";
import { useTranslations } from "next-intl";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import Loading from "@/components/Loading";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/i18n/LanguageSelector";

function WIP() {
  const t = useTranslations("WIP");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Suspense fallback={<Loading />}>
        <SpotifyPlayer />
      </Suspense>

      <div className="divider" />
      <h1 className="text-3xl font-semibold">{t("title")}</h1>

      <div className="flex gap-x-5 items-center">
        <ThemeToggle />
        <LanguageSelector />
      </div>
    </div>
  );
}

export default WIP;
