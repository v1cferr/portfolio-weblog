import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";

export async function GET(request: NextRequest) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;
  const CLIENT_ID = process.env.BATTLENET_CLIENT_ID!;
  const CLIENT_SECRET = process.env.BATTLENET_CLIENT_SECRET!;
  const REDIRECT_URI = process.env.BATTLENET_REDIRECT_URI!;
  const SUPABASE = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

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

    const { access_token, expires_in } = response.data;

    const expirestAt = new Date(Date.now() + expires_in * 1000);

    const localeCookie = request.cookies.get("NEXT_LOCALE");
    const locale = localeCookie ? localeCookie.value : "en-us";

    await SUPABASE.from("blizzard_tokens").insert([
      {
        access_token: access_token,
        expires_at: expirestAt,
        next_locale: locale,
      },
    ]);

    const redirectUrl = `${BASE_URL}/${locale}/wow`;

    return NextResponse.redirect(redirectUrl);
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
