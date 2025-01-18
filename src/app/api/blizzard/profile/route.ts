import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  const token = `não sei ainda - preciso bolar um jeito de pegar o token 
    (seja armazenando em bd ou cache/algo semelhante)`;

  if (!token) {
    return NextResponse.json(
      {
        error: "Token não fornecido.",
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
    // https://us.api.blizzard.com/profile/user/wow?namespace=profile-us&locale=en_US
    // Authorization: Bearer <TOKEN>
    // content-type: application/json;charset=UTF-8

    // Request para buscar os dados da minha conta do wowzinho
    const response = await axios.get(
      "https://us.api.blizzard.com/profile/user/wow?namespace=profile-us&locale=en_US",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "content-type": "application/json;charset=UTF-8",
        },
      }
    );

    const data = await response.data;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro ao descriptografar o token.",
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
