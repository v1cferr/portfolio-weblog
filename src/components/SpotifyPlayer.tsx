"use client";

import { useEffect, useState } from "react";
import { FaSpotify } from "react-icons/fa";
import { IoMdRefresh } from "react-icons/io";
import axios from "axios";
import Image from "next/image";
import Loading from "@/app/loading";

interface CurrentlyPlaying {
  device: {
    is_active: boolean;
    type: string;
    volume_percent: number;
  };
  item: {
    album: {
      name: string;
      images: [{ url: string }];
    };
    artists: [{ name: string }];
    external_urls: { spotify: string };
    name: string;
    duration_ms: number;
  };
  progress_ms: number;
  is_playing: boolean;
}

const SpotifyPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<CurrentlyPlaying | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentTrack = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/refresh");
      const accessToken = data.access_token;

      const trackResponse = await axios.get(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setCurrentTrack(trackResponse.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching current track:", error);
      setError("Error fetching current track.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTrack();
    const interval = setInterval(() => {
      fetchCurrentTrack();
    }, 90000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-1.5">
        <FaSpotify size={30} />
        <p className="text-lg font-semibold">{error}</p>
      </div>
    );
  }

  if (currentTrack === null || !currentTrack?.is_playing) {
    return (
      <div className="flex items-center gap-1.5">
        <FaSpotify size={30} />
        <p className="text-lg font-semibold">No track currently playing.</p>
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
        <IoMdRefresh
          className="cursor-pointer text-gray-500 hover:text-gray-700"
          size={20}
          onClick={() => fetchCurrentTrack()}
        />
      </div>
      <div className="artboard artboard-vertical bg-base-200 rounded-sm w-full flex gap-5 p-5">
        <Image
          className="rounded-md drop-shadow-lg"
          src={currentTrack?.item?.album?.images[0]?.url}
          alt="Album Cover"
          width={100}
          height={100}
          priority
        />
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold">
              {currentTrack?.item?.name}
            </h1>
            <h2 className="text-gray-500">
              {currentTrack?.item?.artists
                .map((artist) => artist.name)
                .join(", ")}
            </h2>
            <p className="text-gray-500">{currentTrack?.item?.album?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
