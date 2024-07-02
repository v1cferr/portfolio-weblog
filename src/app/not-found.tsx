"use client";

import Link from "next/link";
import SpotifyPlayer from "@/components/SpotifyPlayer";

export const metadata = {
  title: "404 error | v1cferr",
  description: "404 error | v1cferr",
};

const NotFoundPage = () => {
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
