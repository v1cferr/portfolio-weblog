import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;
  const CLIENT_ID = process.env.BATTLENET_CLIENT_ID!;
  const CLIENT_SECRET = process.env.BATTLENET_CLIENT_SECRET!;
  const REDIRECT_URI = process.env.BATTLENET_REDIRECT_URI!;

  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        error: "Código de autorização não encontrado.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const response = await axios.post(
      "https://us.battle.net/oauth/token",
      {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${BASE_URL}/${REDIRECT_URI}`,
      },
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // TODO: Criptografar o valor dos atributos e/ou armazenar no https://supabase.com
    const { access_token, expires_in } = response.data;
    const currentTime = Math.floor(Date.now() / 1000);

    const createCookie = (name: string, value: string, maxAge: number) => {
      return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Strict; Domain=${request.nextUrl.hostname};`;
    };

    const cookieOptions = [
      createCookie("access_token", access_token, expires_in),
      createCookie("expires_in", expires_in.toString(), expires_in),
      createCookie("token_set_time", currentTime.toString(), expires_in),
    ];

    const localeCookie = request.cookies.get("NEXT_LOCALE");
    const locale = localeCookie ? localeCookie.value : "en-us";

    const redirectUrl = `${BASE_URL}/${locale}/wow`;

    return NextResponse.redirect(redirectUrl, {
      headers: {
        "Set-Cookie": cookieOptions.join(", "),
      },
    });
  } catch (error) {
    const err = error as any;

    return NextResponse.json(
      {
        error: "Erro ao realizar OAuth.",
        details: err.message,
      },
      {
        status: err.response.status,
      }
    );
  }
}
