"use client";

import Link from "next/link";
import SpotifyPlayer from "@/components/SpotifyPlayer";

const NotFoundPage = () => {
  const accessToken: string | undefined =
    process.env.NEXT_PUBLIC_SPOTIFY_ACCESS_TOKEN; // Substitua pelo token de acesso que você obteve

  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>404 - Página Não Encontrada</h1>
      <p>Desculpe, a página que você está procurando não existe.</p>
      <Link href="/">Voltar para a página inicial</Link>
      <SpotifyPlayer accessToken={accessToken!} />
    </div>
  );
};

export default NotFoundPage;
