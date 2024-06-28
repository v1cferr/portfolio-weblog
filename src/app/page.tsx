import SpotifyPlayer from "@/components/SpotifyPlayer";

export const metadata = {
  title: "v1cferr - spotify (title)",
  description: "v1cferr - spotify (description)",
};

const accessToken: string | undefined =
  process.env.NEXT_PUBLIC_SPOTIFY_ACCESS_TOKEN;

export default function Home() {
  return (
    <div>
      <h1>WIP - Work in Progress</h1>
      <SpotifyPlayer accessToken={accessToken!} />
    </div>
  );
}
