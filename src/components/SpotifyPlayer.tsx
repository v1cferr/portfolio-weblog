"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";

interface SpotifyPlayerProps {
  accessToken: string;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ accessToken }) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null);

  useEffect(() => {
    const fetchCurrentlyPlaying = async () => {
      try {
        const response = await axios.get(
          `/api/currently-playing?access_token=${accessToken}`
        );
        setCurrentlyPlaying(response.data);
      } catch (error) {
        console.error("Erro ao obter a música atual:", error);
      }
    };

    fetchCurrentlyPlaying();
  }, [accessToken]);

  if (!currentlyPlaying) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <p>
        {/* Esta linha está sem tratamento de erros quando a música está pausada (ou não tocando nada). */}
        {currentlyPlaying.item.name} -{" "}
        {currentlyPlaying.item.artists
          .map((artist: any) => artist.name)
          .join(", ")}
      </p>
      <Image
        src={currentlyPlaying.item.album.images[0].url}
        alt="Capa do Álbum"
        width={300}
        height={300}
        priority
      />
    </div>
  );
};

export default SpotifyPlayer;
