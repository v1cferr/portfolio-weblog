import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import "jsr:@std/dotenv/load";
import { createClient } from "https://esm.sh/@supabase/supabase-js@latest";
import axios from "https://esm.sh/axios@latest";

// Funcional quando invocado essa função :D [2025-02-02]
// TODO: Configurar o trigger no DB para chamar a Edge Function a cada 24h
Deno.serve(async () => {
  const DB_SUPABASE_URL = Deno.env.get("DB_SUPABASE_URL")!;
  const DB_SUPABASE_ANON_KEY = Deno.env.get("DB_SUPABASE_ANON_KEY")!;
  const CLIENT_ID = Deno.env.get("BATTLENET_CLIENT_ID")!;
  const CLIENT_SECRET = Deno.env.get("BATTLENET_CLIENT_SECRET")!;

  // console.log("DB_SUPABASE_URL", DB_SUPABASE_URL);
  // console.log("DB_SUPABASE_ANON_KEY", DB_SUPABASE_ANON_KEY);
  // console.log("CLIENT_ID", CLIENT_ID);
  // console.log("CLIENT_SECRET", CLIENT_SECRET);

  console.log("Atualizando token Blizzard...");

  const supabase = createClient(DB_SUPABASE_URL, DB_SUPABASE_ANON_KEY);

  // Obtém o token armazenado
  const { data, error } = await supabase
    .from("blizzard_tokens")
    .select("access_token, expires_at")
    .order("expires_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao buscar o token", details: error }),
      { status: 500 }
    );
  }

  const tokenExpirado = !data || new Date(data.expires_at) <= new Date();

  if (!tokenExpirado) {
    return new Response(
      JSON.stringify({
        message: "Token ainda válido",
        token: data.access_token,
      }),
      { status: 200 }
    );
  }

  // Solicita um novo token
  try {
    const response = await axios.post(
      "https://us.battle.net/oauth/token",
      new URLSearchParams({ grant_type: "client_credentials" }),
      {
        auth: { username: CLIENT_ID, password: CLIENT_SECRET },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Atualiza o banco de dados
    const { error: updateError } = await supabase
      .from("blizzard_tokens")
      .insert([{ access_token, expires_at: expiresAt, next_locale: "en-us" }]);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ message: "Token atualizado", access_token }),
      { status: 200 }
    );
  } catch (error) {
    // deno-lint-ignore no-explicit-any
    const err = error as any;

    return new Response(
      JSON.stringify({
        error: "Falha ao obter novo token",
        details: err.message,
      }),
      { status: 500 }
    );
  }
});
