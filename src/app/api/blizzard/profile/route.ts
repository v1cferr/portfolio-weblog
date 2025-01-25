import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  // TODO: Descriptograr token de acesso ao receber cookie
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

  try {
    const response = await axios.get(
      "https://us.api.blizzard.com/profile/user/wow",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          namespace: "profile-us",
          locale: "en_US",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    const err = error as any;

    return NextResponse.json(
      {
        error: "Erro ao buscar dados do perfil.",
        details: err.message,
      },
      {
        status: 500,
      }
    );
  }
}
