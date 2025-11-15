import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

/**
 *
 */
export async function GET(request: NextRequest) {
  const SUPABASE = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

  const { data, error } = await SUPABASE.from("blizzard_tokens").select("*").order("expires_at", { ascending: false }).limit(1);

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
    const response = await axios.get(`https://us.api.blizzard.com/profile/wow/character/${realmSlug}/${characterName}/character-media`, {
      params: {
        namespace: "profile-us",
        locale: "en_US",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

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
