/** @type {import('next').NextConfig} */
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Permite que o build passe mesmo com erros de TypeScript
    // Use com cuidado! Descomente apenas se necessário
    // ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
        port: "",
        pathname: "/image/**",
      },
      // Imagens aleatórias apenas para testes
      // https://random.imagecdn.app/500/150
      {
        protocol: "https",
        hostname: "random.imagecdn.app",
        port: "",
        pathname: "/**",
      },
      // Imagens dos chars do WoW
      // https://render.worldofwarcraft.com/us/character/stormrage/200/246938824-inset.jpg
      {
        protocol: "https",
        hostname: "render.worldofwarcraft.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default withNextIntl(nextConfig);
