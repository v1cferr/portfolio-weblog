"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { FaSpotify } from "react-icons/fa";

import Loading from "@/components/Loading";

// Tipos
interface ISpotifyTrack {
  album: {
    name: string;
    images: { url: string }[];
  };
  artists: { name: string }[];
  external_urls: { spotify: string };
  name: string;
}

interface ICurrentlyPlaying {
  item?: ISpotifyTrack;
  is_playing: boolean;
}

// Hook personalizado para dados do Spotify
// Este hook gerencia o estado e busca informações sobre a música atual do Spotify
const useSpotifyTrack = () => {
  const [currentTrack, setCurrentTrack] = useState<ICurrentlyPlaying | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastTrackName, setLastTrackName] = useState<string | null>(null);

  // Função para buscar a faixa atual do Spotify
  const fetchCurrentTrack = useCallback(async () => {
    try {
      const response = await fetch("/api/spotify");
      const data: ICurrentlyPlaying = await response.json();

      // Pula a atualização se for a mesma faixa
      if (data.item && lastTrackName === data.item.name) {
        return;
      }

      // Atualiza o nome da última faixa
      setLastTrackName(data.item?.name ?? null);

      // Define os dados da faixa atual
      if (!data.is_playing || !data.item) {
        setCurrentTrack(null);
      } else {
        setCurrentTrack(data);
      }

      setError(null);
    } catch (error) {
      console.error("Erro ao buscar faixa do Spotify:", error);
      setError(
        error instanceof Error ? error.message : "Ocorreu um erro desconhecido"
      );
      setCurrentTrack(null);
    } finally {
      setIsLoading(false);
    }
  }, [lastTrackName]);

  useEffect(() => {
    // Busca inicial
    void fetchCurrentTrack();

    // Configura intervalo de atualização (a cada 15 segundos)
    const interval = setInterval(() => {
      void fetchCurrentTrack();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchCurrentTrack]);

  return { currentTrack, error, isLoading, refetch: fetchCurrentTrack };
};

// Componentes para diferentes estados
// Estado de erro: exibido quando ocorre um erro na busca
const ErrorState = ({ message }: { message: string }) => {
  const t = useTranslations("SpotifyPlayer");
  return (
    <div className="flex items-center gap-x-2">
      <FaSpotify size={30} />
      <p className="text-lg font-semibold">
        {t("error")} {message}
      </p>
    </div>
  );
};

// Estado quando não está tocando nada
const NotPlayingState = () => {
  const t = useTranslations("SpotifyPlayer");
  return (
    <div className="flex items-center gap-x-2">
      <FaSpotify size={30} />
      <p className="text-lg font-semibold">{t("no-track")}</p>
    </div>
  );
};

// Componente que mostra informações da faixa atual
const TrackInfo = ({ track }: { track: SpotifyTrack }) => {
  const t = useTranslations("SpotifyPlayer");
  return (
    <main className="flex gap-5 items-center p-2">
      <Image
        priority
        alt={t("album-cover")}
        className="rounded-md w-auto h-auto"
        height={75}
        src={track.album.images[0].url}
        width={75}
      />
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-base font-semibold">{track.name}</h1>
          <h2 className="text-gray-500 text-sm">
            {track.artists.map((artist) => artist.name).join(", ")}
          </h2>
          <p className="text-gray-500 text-sm">{track.album.name}</p>
        </div>
      </div>
    </main>
  );
};

// Componente principal
// Exibe o que eu estou ouvindo no Spotify em tempo real
const SpotifyPlayer = () => {
  const t = useTranslations("SpotifyPlayer");
  const { currentTrack, error, isLoading } = useSpotifyTrack();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!currentTrack?.is_playing) {
    return <NotPlayingState />;
  }

  return (
    <section className="flex flex-col items-center p-3">
      <header className="flex items-center justify-between w-full px-2 mb-2">
        <div className="flex items-center gap-2">
          <FaSpotify size={25} />
          <h1 className="text-lg font-semibold">{t("listening-to")}</h1>
        </div>
      </header>
      <TrackInfo track={currentTrack.item} />
    </section>
  );
};

export default SpotifyPlayer;
