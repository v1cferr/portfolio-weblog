import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "oi",
    todo: "implementar as rotas de personagem: https://us.api.blizzard.com/profile/user/wow?namespace=profile-us&locale=en_US",
    outro_todo: "implementar uma rota de login automatica api/blizzard/login",
  });
}
