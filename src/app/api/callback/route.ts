import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const client_id: string | undefined = process.env.SPOTIFY_CLIENT_ID;
const client_secret: string | undefined = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri: string | undefined = process.env.SPOTIFY_REDIRECT_URI;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Nenhum código fornecido" },
      { status: 400 }
    );
  }

  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirect_uri!,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
    });

    const { access_token, refresh_token } = response.data;

    // Redirecionar para uma página de sucesso ou exibir o token diretamente
    return NextResponse.json({ access_token, refresh_token });
  } catch (error) {
    console.error("Erro ao obter tokens:", error);
    return NextResponse.json(
      { error: "Falha ao obter tokens" },
      { status: 500 }
    );
  }
}
