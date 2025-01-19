import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const CLIENT_ID = process.env.BATTLENET_CLIENT_ID!;
  const CLIENT_SECRET = process.env.BATTLENET_CLIENT_SECRET!;
  const REDIRECT_URI = process.env.BATTLENET_REDIRECT_URI!;

  const url = request.nextUrl;
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        error: "Código não encontrado.",
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
        redirect_uri: REDIRECT_URI,
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

    const data = await response.data;

    if (data.error) {
      return NextResponse.json(
        {
          error: "Erro ao obter token.",
          data: data.error,
        },
        {
          status: response.status,
        }
      );
    }

    const redirectUrl = new URL("/api/blizzard/profile", request.nextUrl);
    redirectUrl.searchParams.set("access_token", data.access_token);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao realizar OAuth.",
        data: error,
      },
      {
        status: 500,
      }
    );
  }
}
