import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { redis } from "@/utils/redis";

export async function GET(req: NextRequest) {
  try {
    const refresh_token = await redis.get("spotify:refresh_token");

    if (!refresh_token) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 400 }
      );
    }

    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token as string,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    });

    const { access_token } = response.data;

    // Armazena o novo access_token com TTL de 1 hora
    await redis.set("spotify:access_token", access_token, {
      ex: 3600,
    });

    return NextResponse.json({ access_token });
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return NextResponse.json(
      { error: "Failed to refresh access token" },
      { status: 500 }
    );
  }
}
