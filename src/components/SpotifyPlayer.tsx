"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { BiErrorCircle, BiRefresh } from "react-icons/bi";
import { FaSpotify } from "react-icons/fa";
import useSWR from "swr";

// ============================================================
// Interfaces e Tipos
// ============================================================

/**
 * Interface para a faixa do Spotify
 */
interface ISpotifyTrack {
  album: {
    name: string;
    images: { url: string }[];
  };
  artists: { name: string }[];
  external_urls: { spotify: string };
  name: string;
}

/**
 * Interface para a resposta da API do Spotify
 */
interface ICurrentlyPlaying {
  item?: ISpotifyTrack;
  is_playing: boolean;
}

// ============================================================
// Configuração do SWR e API
// ============================================================

/**
 * Chave para cache do SWR
 * Usando uma constante para evitar strings mágicas no código
 */
const SPOTIFY_API_KEY = "/api/spotify";

/**
 * Função para buscar dados do Spotify
 * @returns {Promise<ICurrentlyPlaying>} Dados da faixa atual
 */
const spotifyFetcher = async (): Promise<ICurrentlyPlaying> => {
  const res = await fetch(SPOTIFY_API_KEY);
  if (!res.ok) throw new Error("Falha ao buscar dados do Spotify");
  return res.json();
};

// ============================================================
// Hook personalizado
// ============================================================

/**
 * Hook que gerencia o estado e as requisições à API do Spotify
 * Utiliza SWR para cache e revalidação inteligente
 */
const useSpotifyTrack = () => {
  // Configuração do SWR com otimizações para reduzir chamadas desnecessárias
  const { data, error, isLoading, mutate } = useSWR<ICurrentlyPlaying>(SPOTIFY_API_KEY, spotifyFetcher, {
    refreshInterval: 60000, // 1 minuto - Aumentado para reduzir chamadas
    revalidateOnFocus: false, // Não revalidar quando janela ganha foco
    dedupingInterval: 30000, // 30 segundos para evitar requests duplicados
  });

  // Processamento memorizado dos dados para evitar recálculos desnecessários
  const currentTrack = useMemo(() => {
    return data && data.is_playing && data.item ? data : null;
  }, [data]);

  // Função de atualização manual dos dados
  const refetch = useCallback(() => mutate(), [mutate]);

  return {
    currentTrack,
    error: error?.message ?? null,
    isLoading,
    refetch,
  };
};

// ============================================================
// Componentes de UI
// ============================================================

/**
 * Componente exibido durante o carregamento dos dados
 */
const LoadingState = () => {
  const t = useTranslations("SpotifyPlayer");

  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="flex items-center justify-center h-24 rounded-xl bg-base-200/30 border border-base-300"
    >
      <div className="flex flex-col items-center gap-3">
        <span aria-label={t("loading")} className="loading loading-spinner loading-md text-primary" role="status" />
        <span className="text-xs text-base-content/70">{t("loading")}</span>
      </div>
    </section>
  );
};

/**
 * Componente exibido quando ocorre um erro na requisição
 * @param {string} message - Mensagem de erro a ser exibida
 */
const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => {
  const t = useTranslations("SpotifyPlayer");

  return (
    <motion.section
      animate={{ opacity: 1 }}
      aria-live="assertive"
      className="text-center p-5 space-y-3 bg-error/10 rounded-xl border border-error/20"
      initial={{ opacity: 0 }}
      role="alert"
    >
      <div className="flex justify-center mb-2">
        <div className="p-2 rounded-full bg-error/20">
          <BiErrorCircle aria-hidden="true" className="h-5 w-5 text-error" />
        </div>
      </div>
      <p className="text-error font-medium">{message}</p>
      <button
        aria-label={t("try-again")}
        className="btn btn-outline btn-sm border-error/30 text-error hover:bg-error/10 hover:border-error flex items-center gap-2 mx-auto"
        onClick={onRetry}
      >
        <BiRefresh aria-hidden="true" className="h-3.5 w-3.5" />
        {t("try-again")}
      </button>
    </motion.section>
  );
};

/**
 * Componente exibido quando nenhuma música está tocando no Spotify
 */
const NotPlayingState = () => {
  const t = useTranslations("SpotifyPlayer");

  return (
    <section aria-label={t("no-track")} className="text-center p-6 bg-base-200/30 rounded-xl border border-base-300">
      <div className="flex justify-center mb-3">
        <div className="p-2.5 rounded-full bg-base-300">
          <FaSpotify aria-hidden="true" className="h-5 w-5 text-base-content/60" />
        </div>
      </div>
      <p className="text-base-content/70 font-medium">{t("no-track")}</p>
    </section>
  );
};

/**
 * Componente para exibir informações de uma faixa em reprodução
 * @param {ISpotifyTrack} track - Dados da faixa do Spotify
 */
const TrackInfo = ({ track }: { track: ISpotifyTrack }) => {
  const t = useTranslations("SpotifyPlayer");

  // Formatando os nomes dos artistas usando a localização
  const artistNames = track.artists.map((artist) => artist.name).join(", ");

  return (
    <motion.article
      itemScope
      animate={{ opacity: 1 }}
      className="flex items-center gap-4 p-4 bg-base-200/30 rounded-xl border border-base-300 relative"
      initial={{ opacity: 0 }}
      itemType="https://schema.org/MusicRecording"
    >
      {/* Capa do álbum à esquerda */}
      <figure className="h-16 w-16 flex-shrink-0">
        <Image
          priority
          alt={`${track.album.name} - ${t("album-cover")}`}
          className="rounded-lg object-cover shadow-sm transition-all duration-300"
          height={64}
          itemProp="image"
          quality={100}
          src={track.album.images[0].url}
          width={64}
        />
      </figure>

      {/* Informações da faixa à direita */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate text-base" itemProp="name">
          {track.name}
        </h3>
        <p className="text-sm text-base-content/70 truncate" itemProp="byArtist">
          {artistNames}
        </p>
        <div className="mt-2 flex items-center">
          <div className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full font-medium">
            <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span itemProp="playStatus">{t("now-playing")}</span>
          </div>
        </div>
        <meta content={track.album.name} itemProp="inAlbum" />
      </div>

      {/* Ícone do Spotify no canto superior direito - Link para faixa */}
      <Link
        aria-label={`${t("listen-on-spotify")}: ${track.name}`}
        className="absolute top-2 right-2 hover:opacity-100 transition-opacity"
        href={track.external_urls.spotify}
        itemProp="url"
        rel="noopener noreferrer"
        target="_blank"
        title={`${t("listen-on-spotify")}: ${track.name}`}
      >
        <FaSpotify aria-hidden="true" className="h-4 w-4 text-green-500 opacity-60 hover:opacity-100" />
      </Link>
    </motion.article>
  );
};

// ============================================================
// Componente Principal
// ============================================================

/**
 * Componente principal do player do Spotify
 * Gerencia os diferentes estados e renderiza o componente apropriado
 */
const SpotifyPlayer = () => {
  const t = useTranslations("SpotifyPlayer");
  const { currentTrack, error, isLoading, refetch } = useSpotifyTrack();

  // Renderização condicional baseada no estado atual
  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState message={error} onRetry={() => void refetch()} />;
    if (!currentTrack?.is_playing || !currentTrack.item) return <NotPlayingState />;
    return <TrackInfo track={currentTrack.item} />;
  };

  return (
    <section aria-labelledby="spotify-player-heading" className="w-full space-y-3">
      <h2 className="text-sm font-medium flex items-center gap-2" id="spotify-player-heading">
        <span aria-hidden="true" role="img">
          🎵
        </span>
        <span>{t("listening-title")}</span>
      </h2>
      {renderContent()}
    </section>
  );
};

export default SpotifyPlayer;
