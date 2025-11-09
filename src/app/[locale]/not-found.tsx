"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FaArrowLeft, FaHome } from "react-icons/fa";
import { IoReload } from "react-icons/io5";

/**
 * Página 404 Não Encontrada
 *
 * Exibe uma página de erro quando uma rota não é encontrada.
 * Inclui um temporizador que conta o tempo desde que o usuário chegou à página,
 * além de botões para navegação alternativa.
 *
 */
export default function NotFoundPage() {
  const [timeElapsed, setTimeElapsed] = useState(0);

  /**
   * Efeito para iniciar o temporizador quando o componente é montado
   * Limpa o intervalo quando o componente é desmontado
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * Formata o tempo decorrido em minutos e segundos
   *
   * @param {number} seconds - Segundos totais decorridos
   * @returns {string} Tempo formatado no formato "m:ss"
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <main aria-labelledby="error-title" className="flex items-center justify-center bg-base-100 overflow-y-hidden" role="main">
      <section className="w-full max-w-3xl px-4 md:px-6 py-12 md:py-16">
        <header className="flex flex-col items-center text-center">
          {/* Exibição principal do erro - tamanhos de texto responsivos */}
          <div className="relative">
            <h1
              aria-label="Erro 404"
              className="text-[100px] md:text-[180px] font-black tracking-tighter text-base-content leading-none"
              id="error-title"
            >
              404
            </h1>
            <div
              aria-live="polite"
              className="absolute -top-4 md:-top-6 right-0 bg-neutral text-neutral-content px-3 py-1 rounded-full text-xs md:text-sm font-mono"
            >
              Tempo decorrido: {formatTime(timeElapsed)}
            </div>
          </div>

          {/* Mensagem de erro */}
          <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-base-content">Página não encontrada</h2>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-base-content/70 max-w-lg">
            Desculpe, não conseguimos encontrar a página que você está procurando. Ela pode ter sido movida, excluída ou nunca ter existido.
          </p>
        </header>

        {/* Separador personalizado com Tailwind/DaisyUI */}
        <div
          aria-hidden="true"
          className="my-6 md:my-8 w-full max-w-md h-px bg-gradient-to-r from-transparent via-base-300 to-transparent mx-auto"
          role="separator"
        />

        {/* Botões de ação - empilhados no mobile, em linha no desktop */}
        <nav aria-label="Navegação da página de erro" className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto">
          <Link
            aria-label="Ir para a página inicial"
            className="btn btn-primary text-primary-content w-full sm:w-auto flex items-center gap-2"
            href="/"
          >
            <FaHome aria-hidden="true" className="h-4 w-4" />
            Página inicial
          </Link>
          <Link
            aria-label="Voltar para a página anterior"
            className="btn btn-outline border-base-300 text-base-content hover:border-base-300 w-full sm:w-auto flex items-center gap-2"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            <FaArrowLeft aria-hidden="true" className="h-4 w-4" />
            Voltar
          </Link>
          <button
            aria-label="Recarregar a página"
            className="btn btn-outline border-base-300 text-base-content hover:border-base-300 w-full sm:w-auto flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <IoReload aria-hidden="true" className="h-4 w-4" />
            Recarregar
          </button>
        </nav>

        {/* Rodapé */}
        <footer className="mt-12 md:mt-16 text-center text-base-content/60 text-xs md:text-sm">
          <p>Se você acredita que isso é um erro, por favor entre em contato.</p>
          <p className="mt-2">© {new Date().getFullYear()} Victor Ferreira</p>
        </footer>
      </section>
    </main>
  );
}
