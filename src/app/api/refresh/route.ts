import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/utils/firebaseClient";
import { signInAnonymously } from "firebase/auth";

const client_id: string | undefined = process.env.SPOTIFY_CLIENT_ID;
const client_secret: string | undefined = process.env.SPOTIFY_CLIENT_SECRET;

export async function GET(req: NextRequest) {
  try {
    await signInAnonymously(auth);

    const docRef = doc(db, "spotify", "tokens");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Nenhum refresh token disponível" },
        { status: 400 }
      );
    }

    const { refresh_token } = docSnap.data();

    const response = await axios({
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
    });

    const { access_token } = response.data;

    await updateDoc(docRef, {
      access_token,
      expires_in: 3600,
      timestamp: new Date(),
    });

    return NextResponse.json({ access_token });
  } catch (error: any) {
    console.error("Erro ao renovar o token de acesso:", error);
    if (axios.isAxiosError(error)) {
      console.error("Resposta da API do Spotify:", error.response?.data);
    }

    if (error.code === "permission-denied") {
      console.error("Permission denied. Check Firestore rules.");
    }

    return NextResponse.json(
      { error: "Falha ao renovar o token de acesso" },
      { status: 500 }
    );
  }
}
