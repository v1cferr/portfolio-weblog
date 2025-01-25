import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
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

    // TODO: Criptografar token de acesso antes de armazenar no cookie
    const { access_token, expires_in } = response.data;

    return new NextResponse("Token armazenado.", {
      headers: {
        "Set-Cookie": `access_token=${access_token}; Max-Age=${expires_in}; Path=/; HttpOnly; Secure; SameSite=Strict`,
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
        status: 500,
      }
    );
  }
}
