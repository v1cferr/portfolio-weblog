import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import "jsr:@std/dotenv/load";
import { createClient } from "https://esm.sh/@supabase/supabase-js@latest";
import axios from "https://esm.sh/axios@latest";

// Funcional quando invocado essa função :D [2025-02-02]
// TODO: Configurar o trigger no DB para chamar a Edge Function a cada 24h

// Função principal que será servida pelo Deno
Deno.serve(async () => {
  // Obtém variáveis de ambiente necessárias
  const DB_SUPABASE_URL = Deno.env.get("DB_SUPABASE_URL")!;
  const DB_SUPABASE_ANON_KEY = Deno.env.get("DB_SUPABASE_ANON_KEY")!;
  const CLIENT_ID = Deno.env.get("BATTLENET_CLIENT_ID")!;
  const CLIENT_SECRET = Deno.env.get("BATTLENET_CLIENT_SECRET")!;

  console.log("Atualizando token Blizzard...");

  // Cria um cliente Supabase
  const supabase = createClient(DB_SUPABASE_URL, DB_SUPABASE_ANON_KEY);

  // Obtém o token armazenado no banco de dados
  const { data, error } = await supabase
    .from("blizzard_tokens")
    .select("access_token, expires_at")
    .order("expires_at", { ascending: false })
    .limit(1)
    .single();

  // Verifica se houve erro ao buscar o token
  if (error) {
    return new Response(JSON.stringify({ error: "Erro ao buscar o token", details: error }), { status: 500 });
  }

  // Verifica se o token está expirado
  const tokenExpirado = !data || new Date(data.expires_at) <= new Date();

  // Se o token ainda for válido, retorna a resposta
  if (!tokenExpirado) {
    return new Response(
      JSON.stringify({
        message: "Token ainda válido",
        token: data.access_token,
      }),
      { status: 200 }
    );
  }

  // Solicita um novo token à API da Blizzard
  try {
    const response = await axios.post(
      "https://us.battle.net/oauth/token",
      // Apesar de funcionar, não consigo acessar os dados da conta do wow
      // TODO: Verificar outro método com os escopos `openid wow.profile`
      new URLSearchParams({ grant_type: "client_credentials" }),
      {
        auth: { username: CLIENT_ID, password: CLIENT_SECRET },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Atualiza o banco de dados com o novo token
    const { error: updateError } = await supabase
      .from("blizzard_tokens")
      .insert([{ access_token, expires_at: expiresAt, next_locale: "en-us" }]);

    // Verifica se houve erro ao atualizar o banco de dados
    if (updateError) {
      throw updateError;
    }

    // Retorna a resposta com o novo token
    return new Response(JSON.stringify({ message: "Token atualizado", access_token }), { status: 200 });
  } catch (error) {
    // deno-lint-ignore no-explicit-any
    const err = error as any;

    // Retorna a resposta em caso de falha ao obter novo token
    return new Response(
      JSON.stringify({
        error: "Falha ao obter novo token",
        details: err.message,
      }),
      { status: 500 }
    );
  }
});
