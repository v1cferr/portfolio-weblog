"use client";

import Link from "next/link";
import SpotifyPlayer from "@/components/SpotifyPlayer";

export const metadata = {
  title: "404 error | v1cferr",
  description: "404 error | v1cferr",
};

const NotFoundPage = () => {
  const accessToken: string | undefined =
    process.env.NEXT_PUBLIC_SPOTIFY_ACCESS_TOKEN; // Substitua pelo token de acesso que você obteve

  return (
    <>
      <div>
        <h1>404 - Página Não Encontrada</h1>
        <p>Desculpe, a página que você está procurando não existe.</p>
        <Link href="/">Voltar para a página inicial</Link>
        <SpotifyPlayer />
      </div>
    </>
  );
};

export default NotFoundPage;
