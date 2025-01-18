import { NextResponse } from "next/server";

export async function GET() {
  const scope = process.env.BATTLENET_SCOPE!;
  const state = process.env.BATTLENET_STATE!;
  const redirectUri = process.env.BATTLENET_REDIRECT_URI!;
  const clientId = process.env.BATTLENET_CLIENT_ID!;

  //   https://oauth.battle.net/authorize
  //             ?response_type=code
  //             &scope=openid
  //             &state=AbCdEfG
  //             &redirect_uri=https://localhost
  //             &client_id=<CLIENT ID>

  const params = new URLSearchParams({
    response_type: "code",
    scope: scope,
    state: state,
    redirect_uri: redirectUri,
    client_id: clientId,
  });

  const authUrl = `https://us.battle.net/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
