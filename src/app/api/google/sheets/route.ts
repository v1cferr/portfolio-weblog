import axios from "axios";
import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SHEET_ID = "1CT7apH_TdLH-tlwjsT9B9-8cCPYKYkkV7GbyFVLfE0g";
const RANGE = "A1:F200";

export async function GET() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await axios.get(url);

    console.log("Dados do Google Sheets:", response);

    if (!response.data || !response.data.values) {
      return NextResponse.json({
        data: [],
        detail: "Nenhum dado encontrado",
        status: 404,
      });
    }

    return NextResponse.json({ data: response.data.values });
  } catch (error) {
    console.error("Erro ao buscar os dados do Google Sheets:", error);

    return NextResponse.json({
      data: [],
      detail: "Erro ao buscar os dados do Google Sheets",
      status: 500,
    });
  }
}
