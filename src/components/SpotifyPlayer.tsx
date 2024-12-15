"use client";

import { useCallback, useEffect, useState } from "react";
import { FaSpotify } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import Image from "next/image";
import Loading from "@/components/Loading";
interface CurrentlyPlaying {
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
  const [currentTrack, setCurrentTrack] = useState<CurrentlyPlaying | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentTrack = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/spotify");
      const data = await response.json();

      if (data.error) {
        console.error("Error from API:", data.error);
        setError(data.error);
        return;
      }

      if (!data.is_playing || !data.item) {
        setCurrentTrack(null);
        return;
      }

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
      <div className="flex items-center gap-1.5">
        <FaSpotify size={30} />
        <p className="text-lg font-semibold">Error: {error}</p>
        <button onClick={fetchCurrentTrack} className="ml-2 p-1 rounded">
          <IoMdRefresh size={20} />
        </button>
      </div>
    );
  }

  if (!currentTrack || !currentTrack.is_playing) {
    return (
      <div className="flex items-center gap-1.5">
        <FaSpotify size={30} />
        <p className="text-lg font-semibold">No track currently playing</p>
      </div>
    );
  }

  return (
    <div className="artboard artboard-horizontal bg-base-300 rounded-md w-auto max-w-2xl flex flex-col items-center px-8 py-4">
      <div className="flex items-center justify-between w-full mb-5 gap-10">
        <div className="flex items-center gap-2">
          <FaSpotify size={30} />
          <h1 className="text-xl font-semibold">What am I listening to?</h1>
        </div>
        <button onClick={fetchCurrentTrack} className="p-1 rounded">
          <IoMdRefresh size={20} />
        </button>
      </div>
      <div className="artboard artboard-vertical bg-base-200 rounded-sm w-full flex gap-5 p-5">
        {/* <Image
          className="rounded-md drop-shadow-lg w-auto h-auto"
          src={currentTrack.item.album.images[0].url}
          alt="Album Cover"
          width={100}
          height={100}
          style={{ width: "100px", height: "100px", objectFit: "cover" }}
          priority
        /> */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">{currentTrack.item.name}</h1>
            <h2 className="text-gray-500">
              {currentTrack.item.artists
                .map((artist) => artist.name)
                .join(", ")}
            </h2>
            <p className="text-gray-500">{currentTrack.item.album.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
