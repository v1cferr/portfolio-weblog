import { fetchGoogleSheetData } from "@/utils/fetchSheets";

export default async function VSCode() {
  const sheetData = await fetchGoogleSheetData();

  return (
    <div>
      <h1>VS Code</h1>
      <p>Extensões, temas e configurações</p>

      <div className="overflow-x-auto p-8">
        <table className="table w-full border-collapse border">
          <thead>
            <tr>
              {sheetData[0]?.map((header: string, index: number) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.slice(1).map((row: string[], rowIndex: number) => (
              <tr key={rowIndex}>
                {row.map((cell: string, colIndex: number) => (
                  <td key={colIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
