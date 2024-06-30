"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { FaSpotify } from "react-icons/fa";
// import { IoMdRefresh } from "react-icons/io";

interface CurrentlyPlaying {
  device: {
    is_active: boolean;
    type: string;
    volume_percent: number;
  };
  progress_ms: number;
  is_playing: boolean;
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
}

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${parseInt(seconds) < 10 ? "0" : ""}${seconds}`;
};
console.log(formatTime(123456)); // "2:03"

const SpotifyPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<CurrentlyPlaying | null>(
    null
  );
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchCurrentTrack = async () => {
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
        setProgress(trackResponse.data.progress_ms);
      } catch (error: any) {
        console.error("Error fetching current track:", error);
        setError(error);
      }
    };

    fetchCurrentTrack();
    const interval = setInterval(() => {
      setProgress((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentTrack && !currentTrack.is_playing) {
      setProgress(currentTrack.progress_ms);
    }
  }, [currentTrack]);

  // TODO: make a better loading indicator when no track is playing
  if (!currentTrack) {
    return (
      <>
        <span className="loading loading-infinity loading-lg"></span>
      </>
    );
  }

  const trackProgress = Math.min(progress, currentTrack.item.duration_ms);
  const progressPercentage =
    (trackProgress / currentTrack.item.duration_ms) * 100;

  return (
    <>
      <div className="artboard artboard-horizontal bg-base-300 rounded-box w-auto max-w-2xl p-7 flex flex-col items-center gap-7">
        <div className="flex items-center gap-2.5">
          <FaSpotify size={30} />
          <h1 className="text-xl">What I am listening to now</h1>

          {/* TODO: refresh button logic - refresh the component on click + update the style */}
          {/* <IoMdRefresh size={20} /> */}
        </div>
        <div className="flex gap-5">
          <Image
            className="rounded-md drop-shadow-lg"
            src={currentTrack.item.album.images[0].url}
            alt="Album Cover"
            width={225}
            height={225}
            priority
          />
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold">
                {currentTrack.item.name}
              </h1>
              <h2 className="text-gray-500">
                {currentTrack.item.artists
                  .map((artist) => artist.name)
                  .join(", ")}
              </h2>
              <p className="text-gray-500">{currentTrack.item.album.name}</p>
            </div>

            {/* TODO: progress bar logic - when it finishes playing, update the status */}
            <div className="w-full mt-4">
              <div className="flex items-center justify-between text-gray-400 text-sm">
                <span>{formatTime(trackProgress)}</span>
                <span>{formatTime(currentTrack.item.duration_ms)}</span>
              </div>
              <input
                type="range"
                value={progressPercentage}
                max="100"
                readOnly
                className="w-full mt-2 h-1 bg-gray-700 rounded-full appearance-none"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SpotifyPlayer;
