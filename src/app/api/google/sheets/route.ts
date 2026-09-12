import axios from "axios";
import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SHEET_ID = "1CT7apH_TdLH-tlwjsT9B9-8cCPYKYkkV7GbyFVLfE0g";
const RANGE = "A1:F200";

/**
 * Reads data from a Google Sheets spreadsheet through the Google Sheets API.
 *
 * @description Issues a GET request against the Google Sheets v4 API to read
 * values from a given spreadsheet. The SHEET_ID, RANGE and API_KEY environment
 * variables make up the request URL.
 *
 * @returns {Promise<NextResponse>} A JSON response containing:
 * - On success: `{ data: any[][] }`, a two-dimensional array of the sheet values
 * - On an empty sheet: `{ data: [], detail: "No data found", status: 404 }`
 * - On failure: `{ data: [], detail: "Failed to fetch data from Google Sheets", status: 500 }`
 *
 * @throws {Error} Logs to the console when the Google Sheets API cannot be reached
 *
 * @example
 * ```typescript
 * // Exemplo de resposta bem-sucedida
 * {
 *   data: [
 *     ["Nome", "Idade", "Email"],
 *     ["João", "25", "joao@email.com"],
 *     ["Maria", "30", "maria@email.com"]
 *   ]
 * }
 * ```
 *
 * @see {@link https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get Google Sheets API Documentation}
 */
export async function GET(): Promise<NextResponse> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await axios.get(url);

    if (!response.data?.values) {
      return NextResponse.json({
        data: [],
        detail: "No data found",
        status: 404,
      });
    }

    return NextResponse.json({ data: response.data.values });
  } catch (error) {
    console.error("Erro ao buscar os dados do Google Sheets:", error);

    return NextResponse.json({
      data: [],
      detail: "Failed to fetch data from Google Sheets",
      status: 500,
    });
  }
}
