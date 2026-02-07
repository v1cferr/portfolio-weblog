/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/**
 * Next.js configuration
 * @see https://nextjs.org/docs/app/api-reference/next-config-js
 */
const nextConfig = {
  // Habilita modo estrito do React para auxiliar na detecção de problemas em desenvolvimento
  reactStrictMode: true,
  /**
   * Configuração de imagens remotas otimizadas
   * Define hosts permitidos para otimização automática de imagens
   * @see https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
   */
  images: {
    remotePatterns: [
      // Imagens do Spotify
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/image/**",
      },
      // Imagens de teste (opcional - considere remover em produção)
      {
        protocol: "https",
        hostname: "random.imagecdn.app",
        port: "",
        pathname: "/**",
      },
      // Renders de personagens do World of Warcraft
      {
        protocol: "https",
        hostname: "render.worldofwarcraft.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  /**
   * Configuração do webpack para SVG
   * Permite importar SVGs como componentes React usando @svgr/webpack
   */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default withNextIntl(nextConfig);
