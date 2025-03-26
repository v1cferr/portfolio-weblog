/* eslint-disable react/jsx-sort-props */
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { BiErrorCircle, BiRefresh } from "react-icons/bi";
import { FaSpotify, FaPlay } from "react-icons/fa";

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

      // Ignora atualização se for a mesma faixa
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

    // Intervalo de atualização (a cada 15 segundos)
    const interval = setInterval(() => {
      void fetchCurrentTrack();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchCurrentTrack]);

  return { currentTrack, error, isLoading, refetch: fetchCurrentTrack };
};

// Componente de estado de carregamento
const LoadingState = () => {
  const t = useTranslations("SpotifyPlayer");

  return (
    <div className="flex items-center justify-center h-24 rounded-xl bg-base-200/30 border border-base-300">
      <div className="flex flex-col items-center gap-3">
        <span className="loading loading-spinner loading-md text-primary" />
        <span className="text-xs text-base-content/70">{t("loading")}</span>
      </div>
    </div>
  );
};

// Componente de estado de erro
const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => {
  const t = useTranslations("SpotifyPlayer");

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      className="text-center p-5 space-y-3 bg-error/10 rounded-xl border border-error/20">
      <div className="flex justify-center mb-2">
        <div className="p-2 rounded-full bg-error/20">
          <BiErrorCircle className="h-5 w-5 text-error" />
        </div>
      </div>
      <p className="text-error font-medium">{message}</p>
      <button
        className="btn btn-outline btn-sm border-error/30 text-error hover:bg-error/10 hover:border-error flex items-center gap-2 mx-auto"
        onClick={onRetry}>
        <BiRefresh className="h-3.5 w-3.5" />
        {t("try-again")}
      </button>
    </motion.div>
  );
};

// Componente de estado quando nenhuma faixa está tocando
const NotPlayingState = () => {
  const t = useTranslations("SpotifyPlayer");

  return (
    <div className="text-center p-6 bg-base-200/30 rounded-xl border border-base-300">
      <div className="flex justify-center mb-3">
        <div className="p-2.5 rounded-full bg-base-300">
          <FaSpotify className="h-5 w-5 text-base-content/60" />
        </div>
      </div>
      <p className="text-base-content/70 font-medium">{t("no-track")}</p>
    </div>
  );
};

// Componente de informações da faixa
const TrackInfo = ({ track }: { track: ISpotifyTrack }) => {
  const t = useTranslations("SpotifyPlayer");

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      className="flex items-center gap-4 p-4 bg-base-200/30 rounded-xl border border-base-300 relative">
      {/* Capa do álbum à esquerda */}
      <div className="relative group h-16 w-16 flex-shrink-0">
        <Image
          priority
          alt={t("album-cover")}
          className="rounded-lg object-cover shadow-sm group-hover:shadow-md transition-all duration-300"
          height={64}
          width={64}
          src={track.album.images[0].url}
        />
        <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <FaPlay className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Informações da faixa à direita */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate text-base">{track.name}</h3>
        <p className="text-sm text-base-content/70 truncate">
          {track.artists.map((artist) => artist.name).join(", ")}
        </p>
        <div className="mt-2 flex items-center">
          <div className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t("now-playing")}
          </div>
        </div>
      </div>

      {/* Ícone do Spotify no canto superior direito */}
      <div className="absolute top-2 right-2">
        <FaSpotify className="h-4 w-4 text-green-500 opacity-60" />
      </div>
    </motion.div>
  );
};

// Componente principal
const SpotifyPlayer = () => {
  const t = useTranslations("SpotifyPlayer");
  const { currentTrack, error, isLoading, refetch } = useSpotifyTrack();

  return (
    <div className="w-full space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <span>🎵</span>
        <span>{t("listening-title")}</span>
      </h3>

      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : !currentTrack?.is_playing || !currentTrack.item ? (
        <NotPlayingState />
      ) : (
        <TrackInfo track={currentTrack.item} />
      )}
    </div>
  );
};

export default SpotifyPlayer;
