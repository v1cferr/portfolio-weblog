import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const tokenCookie = request.cookies.get("access_token");

  if (!tokenCookie) {
    return NextResponse.json(
      {
        error: "Token de acesso não encontrado.",
      },
      {
        status: 401,
      }
    );
  }

  const token = tokenCookie.value;
  const realmSlug = request.nextUrl.searchParams.get("realmSlug");
  const characterName = request.nextUrl.searchParams.get("characterName");

  if (!realmSlug || !characterName) {
    return NextResponse.json(
      {
        error: "Reino ou personagem não informado.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    // https://us.api.blizzard.com
    // /profile/wow/character
    // /${realmSlug}/${characterName}/character-media
    // ?namespace=profile-us
    // &locale=en_US
    const response = await axios.get(
      `https://us.api.blizzard.com/profile/wow/character/${realmSlug}/${characterName}/character-media`,
      {
        params: {
          namespace: "profile-us",
          locale: "en_US",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    const err = error as any;

    return NextResponse.json(
      {
        error: "Erro ao buscar dados de aparência do personagem.",
        details: err.message,
      },
      {
        status: 500,
      }
    );
  }
}
