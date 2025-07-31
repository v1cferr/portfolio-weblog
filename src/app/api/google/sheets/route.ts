import axios from "axios";
import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SHEET_ID = "1CT7apH_TdLH-tlwjsT9B9-8cCPYKYkkV7GbyFVLfE0g";
const RANGE = "A1:F200";

/**
 * Busca dados de uma planilha do Google Sheets através da API do Google Sheets.
 *
 * @description Esta função realiza uma requisição GET para a API do Google Sheets v4
 * para obter valores de uma planilha específica. Utiliza as variáveis de ambiente
 * SHEET_ID, RANGE e API_KEY para construir a URL da requisição.
 *
 * @returns {Promise<NextResponse>} Retorna uma resposta JSON contendo:
 * - Em caso de sucesso: `{ data: any[][] }` - Array bidimensional com os valores da planilha
 * - Em caso de planilha vazia: `{ data: [], detail: "Nenhum dado encontrado", status: 404 }`
 * - Em caso de erro: `{ data: [], detail: "Erro ao buscar os dados do Google Sheets", status: 500 }`
 *
 * @throws {Error} Registra erros no console quando falha ao acessar a API do Google Sheets
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
