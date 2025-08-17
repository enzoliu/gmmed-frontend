import * as XLSX from "xlsx";

export type Cell = string | number | boolean | null;
export type Row = Record<string, Cell>;

/**
 * 讀取 Excel 或 CSV 檔案並轉換為 JSON
 * @param file File 物件（例如從 <input type="file"> 取得）
 * @param hasHeader true: 使用第一列作為欄位名稱，回傳 Row[]; false: 回傳二維陣列 Cell[][]
 */
export async function ReadExcelOrCSV(
  file: File,
  hasHeader: boolean = true
): Promise<Row[] | Cell[][]> {
  const isCSV =
    /\.csv$/i.test(file.name) ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel"; // 有些瀏覽器給 csv 這個 mime

  const content = await new Promise<ArrayBuffer | string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer | string);
    reader.onerror = (err) => reject(err);
    if (isCSV) {
      reader.readAsText(file); // CSV 用文字方式讀
    } else {
      reader.readAsArrayBuffer(file); // Excel 用 ArrayBuffer
    }
  });

  const workbook = XLSX.read(content, { type: isCSV ? "string" : "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  if (hasHeader) {
    return XLSX.utils.sheet_to_json<Row>(worksheet, { defval: "" });
  } else {
    return XLSX.utils.sheet_to_json<Cell[]>(worksheet, {
      header: 1,
      defval: "",
    });
  }
}