import "server-only";
import * as XLSX from "xlsx";

export interface XlsxSheetSpec {
  name: string;
  rows: Record<string, string | number | Date | null | undefined>[];
}

/**
 * Construye un Buffer XLSX a partir de N hojas. Cada hoja recibe un array
 * de objetos planos; las columnas se infieren de las claves de la primera fila.
 */
export function buildXlsxBuffer(sheets: XlsxSheetSpec[]): Buffer {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
