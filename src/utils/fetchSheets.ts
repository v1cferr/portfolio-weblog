import axios from "axios";

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SHEET_ID = "1CT7apH_TdLH-tlwjsT9B9-8cCPYKYkkV7GbyFVLfE0g";
const RANGE = "A1:D200";

// VSCode Extensions:
// https://docs.google.com/spreadsheets/d/1CT7apH_TdLH-tlwjsT9B9-8cCPYKYkkV7GbyFVLfE0g/edit?gid=906698806#gid=906698806

// Spreadsheet ID:
// https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit?gid=SHEET_ID#gid=SHEET_ID

export async function fetchGoogleSheetData() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const res = await axios.get(url);
    return res.data.values || [];
  } catch (error) {
    console.error("Erro ao buscar os dados do Google Sheets:", error);
    return [];
  }
}
