import { NextResponse } from "next/server";

export async function GET() {
  const RESPONSE_TYPE = "code";
  const SCOPE = "openid wow.profile";
  const STATE = process.env.BATTLENET_STATE!;
  const REDIRECT_URI = process.env.BATTLENET_REDIRECT_URI!;
  const CLIENT_ID = process.env.BATTLENET_CLIENT_ID!;

  //   https://oauth.battle.net/authorize
  //             ?response_type=code
  //             &scope=openid
  //             &state=AbCdEfG
  //             &redirect_uri=https://localhost
  //             &client_id=<CLIENT ID>

  const params = new URLSearchParams({
    response_type: RESPONSE_TYPE,
    scope: SCOPE,
    state: STATE,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
  });

  const authUrl = `https://us.battle.net/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
