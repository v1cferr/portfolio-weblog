import { Suspense } from "react";
import { Metadata } from "next";
import Loading from "@/components/Loading";
// import SpotifyPlayer from "@/components/SpotifyPlayer";
import ThemeToggle from "@/components/ThemeToggle";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  title: "Work In Progress | v1cferr",
};

export default function Home() {
  const t = useTranslations("Home");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 gap-3">
      <div className="flex flex-col gap-5">
        <ThemeToggle />
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        {/* <div className="divider"></div> */}
      </div>
      {/* <Suspense fallback={<Loading />}>
        <SpotifyPlayer />
      </Suspense> */}
    </div>
  );
}
