import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  // TODO: Descriptograr valor dos atributos e/ou buscar no https://supabase.com
  const tokenCookie = request.cookies.get("access_token");
  const expiresCookie = request.cookies.get("expires_in");
  const tokenSetTimeCookie = request.cookies.get("token_set_time");

  if (!tokenCookie || !expiresCookie || !tokenSetTimeCookie) {
    return NextResponse.json(
      {
        error: "Token de acesso ou informação de expiração não encontrado.",
      },
      {
        status: 401,
      }
    );
  }

  const token = tokenCookie.value;
  const expiresIn = parseInt(expiresCookie.value, 10); // Tempo de expiração em segundos
  const tokenSetTime = parseInt(tokenSetTimeCookie.value, 10); // Tempo em que o token foi definido, em segundos
  const currentTime = Math.floor(Date.now() / 1000); // Tempo atual em segundos

  const tokenExpirationTime = tokenSetTime + expiresIn; // Tempo de expiração do token

  // Verifica se o token está prestes a expirar (menos de 5 minutos restantes)
  if (currentTime >= tokenExpirationTime - 300) {
    const loginUrl = "/api/blizzard/login";
    return NextResponse.redirect(loginUrl); // Redireciona para a URL de login
  }

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
        status: err.response.status,
      }
    );
  }
}
