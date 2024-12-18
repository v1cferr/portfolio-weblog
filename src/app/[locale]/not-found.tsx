"use client";

import Link from "next/link";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import Head from "next/head";

const NotFoundPage = () => {
  return (
    <>
      <Head>
        <title>404 error | v1cferr</title>
        <meta name="description" content="404 error | v1cferr" />
      </Head>
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
