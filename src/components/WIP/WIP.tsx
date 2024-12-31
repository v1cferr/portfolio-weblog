import { Suspense } from "react";
import { useTranslations } from "next-intl";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import Loading from "@/components/Loading";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/i18n/LanguageSelector";

function WIP() {
  const t = useTranslations("WIP");

  return (
    <div className="flex h-auto flex-col items-center justify-center shadow-md p-5 rounded-md">
      <Suspense fallback={<Loading />}>
        <SpotifyPlayer />
      </Suspense>

      <div className="divider" />
      <h1 className="text-lg font-semibold">{t("title")}</h1>

      <div className="flex gap-x-5 items-center mt-1">
        <ThemeToggle />
        <LanguageSelector />
      </div>
    </div>
  );
}

export default WIP;
