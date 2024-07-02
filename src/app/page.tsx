import { Suspense } from "react";
import Loading from "@/app/loading";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = {
  title: "v1cferr - spotify (title)",
  description: "v1cferr - spotify (description)",
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 gap-3">
      <div className="flex flex-col gap-5">
        <ThemeToggle />
        <h1 className="text-3xl font-semibold">🛠️ Work in Progress 🚧</h1>
        <div className="divider"></div>
      </div>
      <Suspense fallback={<Loading />}>
        <SpotifyPlayer />
      </Suspense>
    </div>
  );
}
