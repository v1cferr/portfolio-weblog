import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

export async function GET(request: NextRequest) {
  const SUPABASE = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await SUPABASE.from("blizzard_tokens")
    .select("*")
    .order("expires_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return NextResponse.json(
      {
        error: "Token de acesso ou informação de expiração não encontrado.",
      },
      {
        status: 401,
      }
    );
  }

  const token = data[0].access_token;

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
