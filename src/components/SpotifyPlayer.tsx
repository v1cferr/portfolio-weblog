"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useRef } from "react";
import { FaSpotify } from "react-icons/fa";

import Loading from "@/components/Loading";

interface ICurrentlyPlaying {
  item: {
    album: {
      name: string;
      images: [{ url: string }];
    };
    artists: [{ name: string }];
    external_urls: { spotify: string };
    name: string;
  };
  is_playing: boolean;
}

const SpotifyPlayer = () => {
  const t = useTranslations("SpotifyPlayer");
  const [currentTrack, setCurrentTrack] = useState<ICurrentlyPlaying | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastTrackRef = useRef<ICurrentlyPlaying | null>(null);

  const fetchCurrentTrack = useCallback(async () => {
    try {
      // setIsLoading(true);

      const response = await fetch("/api/spotify");
      const data = await response.json();

      // Caso a música seja a mesma
      // Não atualiza o estado de loading
      if (
        lastTrackRef.current &&
        lastTrackRef.current.item.name === data.item.name
      ) {
        setIsLoading(false);
        return;
      }

      // Caso não esteja tocando nada
      // Adiciona como null e retorna
      if (!data.is_playing || !data.item) {
        setCurrentTrack(null);
        return;
      }

      lastTrackRef.current = data;
      setCurrentTrack(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching current track:", error);
      setError(
        error instanceof Error ? error.message : "Error fetching current track."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (mounted) {
        await fetchCurrentTrack();
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchCurrentTrack]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-x-2">
        <FaSpotify size={30} />
        <p className="text-lg font-semibold">
          {t("error")} {error}
        </p>
        {/* <button onClick={fetchCurrentTrack} className="ml-2 p-1 rounded">
          <IoMdRefresh size={20} />
        </button> */}
      </div>
    );
  }

  if (!currentTrack?.is_playing) {
    return (
      <div className="flex items-center gap-x-2">
        <FaSpotify size={30} />
        <p className="text-lg font-semibold">{t("no-track")}</p>
      </div>
    );
  }

  return (
    <section className="flex flex-col items-center p-3">
      <header className="flex items-center justify-between w-full px-2 mb-2">
        <div className="flex items-center gap-2">
          <FaSpotify size={25} />
          <h1 className="text-lg font-semibold">{t("listening-to")}</h1>
        </div>
        {/* <button onClick={fetchCurrentTrack} disabled={isLoading}>
          <IoMdRefresh size={20} />
        </button> */}
      </header>
      <main className="flex gap-5 items-center p-2">
        <Image
          priority
          alt={t("album-cover")}
          className="rounded-md w-auto h-auto"
          height={75}
          src={currentTrack.item.album.images[0].url}
          width={75}
        />
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-base font-semibold">
              {currentTrack.item.name}
            </h1>
            <h2 className="text-gray-500 text-sm">
              {currentTrack.item.artists
                .map((artist) => artist.name)
                .join(", ")}
            </h2>
            <p className="text-gray-500 text-sm">
              {currentTrack.item.album.name}
            </p>
          </div>
        </div>
      </main>
    </section>
  );
};

export default SpotifyPlayer;
