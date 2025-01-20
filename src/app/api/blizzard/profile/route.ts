import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("access_token");

  if (!token) {
    return NextResponse.json(
      {
        error: "Token não fornecido.",
      },
      {
        status: 400,
      }
    );
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

    const data = await response.data;

    if (data.error) {
      return NextResponse.json(
        {
          error: "Erro ao obter dados do perfil.",
          data: data.error,
        },
        {
          status: response.status,
        }
      );
    }

    const script = `
      <script>
        localStorage.setItem('profileData', JSON.stringify(${JSON.stringify(
          data
        )}));
        window.location.href = '/en-us/test';
      </script>
    `;

    return new NextResponse(script, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Falha ao obter os dados do perfil.",
        data: error,
      },
      {
        status: 500,
      }
    );
  }
}
