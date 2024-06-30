import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import redisClient from "@/utils/redisClient";

const client_id: string | undefined = process.env.SPOTIFY_CLIENT_ID;
const client_secret: string | undefined = process.env.SPOTIFY_CLIENT_SECRET;

export async function GET(req: NextRequest) {
  const refresh_token = await redisClient.get("spotify_refresh_token");

  if (!refresh_token) {
    return NextResponse.json(
      { error: "Nenhum refresh token disponível" },
      { status: 400 }
    );
  }

  try {
    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token!,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
    });

    const { access_token } = response.data;

    await redisClient.set("spotify_access_token", access_token, { EX: 3600 });

    return NextResponse.json({ access_token });
  } catch (error) {
    console.error("Erro ao renovar o token de acesso:", error);
    return NextResponse.json(
      { error: "Falha ao renovar o token de acesso" },
      { status: 500 }
    );
  }
}
