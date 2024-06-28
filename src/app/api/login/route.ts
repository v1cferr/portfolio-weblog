import { NextRequest, NextResponse } from "next/server";
import { stringify } from "querystring";

// Função para gerar uma string aleatória para o parâmetro state
function generateRandomString(tamanho: number): string {
  let texto = "";
  const possivel =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < tamanho; i++) {
    texto += possivel.charAt(Math.floor(Math.random() * possivel.length));
  }
  return texto;
}

const client_id: string | undefined = process.env.SPOTIFY_CLIENT_ID;
const redirect_uri: string | undefined = process.env.SPOTIFY_REDIRECT_URI;

export async function GET() {
  const state = generateRandomString(16);
  const scope = "user-read-private user-read-email user-read-currently-playing";

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    stringify({
      response_type: "code",
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state,
    });

  return NextResponse.redirect(authUrl);
}
