import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const access_token = searchParams.get("access_token");

  if (!access_token) {
    return NextResponse.json(
      { error: "Access token is required" },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (response.status === 204 || response.data === "") {
      return NextResponse.json(
        { message: "No content is currently playing." },
        { status: 200 }
      );
    } else {
      return NextResponse.json(response.data, { status: 200 });
    }
  } catch (error) {
    console.error("Erro ao obter a música atual:", error);
    return NextResponse.json(
      { error: "Falha ao obter a música atual" },
      { status: 500 }
    );
  }
}
