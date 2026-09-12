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
// Interfaces and types
// ============================================================

/**
 * A track as returned by Spotify
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
 * The shape of the Spotify API response
 */
interface ICurrentlyPlaying {
  item?: ISpotifyTrack;
  is_playing: boolean;
}

// ============================================================
// SWR and API configuration
// ============================================================

/**
 * SWR cache key, kept in a constant to avoid
 * magic strings scattered through the file
 */
const SPOTIFY_API_KEY = "/api/spotify";

/**
 * Fetches the current track from our Spotify route
 * @returns {Promise<ICurrentlyPlaying>} The currently playing track
 */
const spotifyFetcher = async (): Promise<ICurrentlyPlaying> => {
  const res = await fetch(SPOTIFY_API_KEY);
  if (!res.ok) throw new Error("Failed to fetch data from Spotify");
  return res.json();
};

// ============================================================
// Custom hook
// ============================================================

/**
 * Owns the state and the requests to the Spotify route,
 * using SWR for caching and revalidation
 */
const useSpotifyTrack = () => {
  // SWR is tuned to keep the request rate down
  const { data, error, isLoading, mutate } = useSWR<ICurrentlyPlaying>(SPOTIFY_API_KEY, spotifyFetcher, {
    refreshInterval: 60000, // 1 minute, raised to cut down on requests
    revalidateOnFocus: false, // Do not revalidate when the window regains focus
    dedupingInterval: 30000, // 30 seconds, to drop duplicate requests
  });

  // Memoised so the derived value is not recomputed on every render
  const currentTrack = useMemo(() => {
    return data && data.is_playing && data.item ? data : null;
  }, [data]);

  // Manual refresh
  const refetch = useCallback(() => mutate(), [mutate]);

  return {
    currentTrack,
    error: error?.message ?? null,
    isLoading,
    refetch,
  };
};

// ============================================================
// UI components
// ============================================================

/**
 * Shown while the data is loading
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
 * Shown when the request fails
 * @param {string} message - The error message to display
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
 * Shown when nothing is playing
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
 * Shows the details of the track currently playing
 * @param {ISpotifyTrack} track - The Spotify track
 */
const TrackInfo = ({ track }: { track: ISpotifyTrack }) => {
  const t = useTranslations("SpotifyPlayer");

  // Artist names, joined for display
  const artistNames = track.artists.map((artist) => artist.name).join(", ");

  return (
    <motion.article
      itemScope
      animate={{ opacity: 1 }}
      className="flex items-center gap-4 p-4 bg-base-200/30 rounded-xl border border-base-300 relative"
      initial={{ opacity: 0 }}
      itemType="https://schema.org/MusicRecording"
    >
      {/* Album cover on the left */}
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

      {/* Track details on the right */}
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

      {/* Spotify icon in the top right corner, linking to the track */}
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
// Main component
// ============================================================

/**
 * The Spotify player itself,
 * dispatching to the component that matches the current state
 */
const SpotifyPlayer = () => {
  const t = useTranslations("SpotifyPlayer");
  const { currentTrack, error, isLoading, refetch } = useSpotifyTrack();

  // Picks the view for the current state
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
