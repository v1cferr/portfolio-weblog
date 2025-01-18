import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        error: "Código OAuth não fornecido.",
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const response = await axios.post(
      "https://us.battle.net/oauth/token",
      {
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.BATTLENET_REDIRECT_URI,
      },
      {
        auth: {
          username: process.env.BATTLENET_CLIENT_ID!,
          password: process.env.BATTLENET_CLIENT_SECRET!,
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
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return NextResponse.json(
      {
        message: "OAuth realizado com sucesso! Token obtido.",
        data: data,
      },
      {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao realizar OAuth.",
        data: error,
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
