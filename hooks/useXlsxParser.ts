"use client";

import { useState, useCallback } from "react";

export interface RawRow {
  date: Date;
  description: string;
  amount: number;
}

export interface ParsedRow extends RawRow {
  normalizedDescription: string;
  category: string | null;
  autoMatched: boolean;
}

export type ParseStatus = "idle" | "parsing" | "done" | "error";

interface UseParserReturn {
  status: ParseStatus;
  rows: ParsedRow[];
  error: string | null;
  parseFile: (file: File, existingMappings: Record<string, string>) => void;
  reset: () => void;
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

// ── BNL CSV ────────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ";" && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDateDMY(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
}

function parseBnlCsv(text: string): RawRow[] | string {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let headerIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const cols = parseCsvLine(lines[i]);
    if (
      cols.length >= 4 &&
      cols.some((c) => /^data\s*contabile$/i.test(c.trim()))
    ) {
      headerIdx = i;
      headers = cols.map((c) => c.toLowerCase().trim());
      break;
    }
  }
  if (headerIdx === -1) return "Header BNL non trovato";

  const iDate = headers.findIndex((h) => /^data\s*contabile$/i.test(h));
  const iDesc = headers.findIndex((h) => /^descrizione$/i.test(h));
  const iDetail = headers.findIndex((h) => /^dettaglio$/i.test(h));
  const iAmount = headers.findIndex((h) => /^importo$/i.test(h));
  if (iDate === -1 || iDesc === -1 || iAmount === -1)
    return `Colonne BNL non trovate: ${headers.join(", ")}`;

  const rows: RawRow[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < Math.max(iDate, iDesc, iAmount) + 1) continue;
    const date = parseDateDMY(cols[iDate]);
    if (!date || isNaN(date.getTime())) continue;
    const desc = cols[iDesc].trim();
    const detail = iDetail >= 0 ? cols[iDetail].trim() : "";
    const description = detail ? `${desc} - ${detail}` : desc;
    if (!description) continue;
    const amount = parseFloat(
      cols[iAmount]
        .trim()
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^0-9.\-+]/g, "")
    );
    if (!amount) continue;
    rows.push({ date, description, amount });
  }
  return rows.length ? rows : "Nessuna riga BNL riconosciuta";
}

// ── FINECO XLSX ─────────────────────────────────────────────────────────────
// Date come seriale Excel, Entrate/Uscite su colonne separate

function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial) - 25569;
  const d = new Date(utcDays * 86400000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function colLetterToIdx(ref: string): number {
  const letters = ref.replace(/[0-9]/g, "");
  let n = 0;
  for (const ch of letters) n = n * 26 + ch.charCodeAt(0) - 64;
  return n - 1;
}

// Legge un file ZIP nel browser senza librerie esterne
async function readZipFile(
  buffer: ArrayBuffer
): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buffer);
  const files = new Map<string, Uint8Array>();

  // Cerca End of Central Directory signature (0x06054b50) dalla fine
  let eocdOffset = -1;
  for (let i = buffer.byteLength - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("EOCD non trovato");

  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const cdSize = view.getUint32(eocdOffset + 12, true);

  let pos = cdOffset;
  const end = cdOffset + cdSize;

  while (pos < end) {
    if (view.getUint32(pos, true) !== 0x02014b50) break;
    const compMethod = view.getUint16(pos + 10, true);
    const compSize = view.getUint32(pos + 20, true);
    const uncompSize = view.getUint32(pos + 24, true);
    const fileNameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);

    const fileName = new TextDecoder().decode(
      new Uint8Array(buffer, pos + 46, fileNameLen)
    );
    pos += 46 + fileNameLen + extraLen + commentLen;

    // Leggi local file header per trovare offset dati
    const localExtraLen = view.getUint16(localOffset + 28, true);
    const dataOffset = localOffset + 30 + fileNameLen + localExtraLen;
    const compData = new Uint8Array(buffer, dataOffset, compSize);

    if (compMethod === 0) {
      // Stored
      files.set(fileName, compData.slice());
    } else if (compMethod === 8) {
      // Deflate — usa DecompressionStream
      const ds = new DecompressionStream("deflate-raw");
      const writer = ds.writable.getWriter();
      const reader = ds.readable.getReader();
      writer.write(compData);
      writer.close();
      const chunks: Uint8Array[] = [];
      let totalLen = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLen += value.length;
      }
      const out = new Uint8Array(uncompSize || totalLen);
      let offset = 0;
      for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
      }
      files.set(fileName, out);
    }
  }
  return files;
}

async function parseFinecoXlsx(
  buffer: ArrayBuffer
): Promise<RawRow[] | string> {
  const files = await readZipFile(buffer);

  const sheetData = files.get("xl/worksheets/sheet1.xml");
  if (!sheetData) return "sheet1.xml non trovato nell'XLSX";

  const decoder = new TextDecoder("utf-8");

  // Shared strings
  let sharedStrings: string[] = [];
  const ssData = files.get("xl/sharedStrings.xml");
  if (ssData) {
    const ssXml = decoder.decode(ssData);
    const doc = new DOMParser().parseFromString(ssXml, "text/xml");
    sharedStrings = Array.from(doc.querySelectorAll("si")).map((si) =>
      Array.from(si.querySelectorAll("t"))
        .map((t) => t.textContent ?? "")
        .join("")
    );
  }

  const sheetXml = decoder.decode(sheetData);
  const doc = new DOMParser().parseFromString(sheetXml, "text/xml");

  const getCellValue = (c: Element): string => {
    const t = c.getAttribute("t") ?? "";
    const v = c.querySelector("v")?.textContent ?? "";
    if (t === "s") return sharedStrings[parseInt(v)] ?? "";
    if (t === "str") return c.querySelector("t")?.textContent ?? v;
    return v;
  };

  const allRows = Array.from(doc.querySelectorAll("row"));

  // Trova header row con "data_operazione"
  let headerRowIdx = -1;
  let headers: string[] = [];
  for (let i = 0; i < Math.min(allRows.length, 20); i++) {
    const cells = Array.from(allRows[i].querySelectorAll("c"));
    const vals = cells.map(getCellValue).map((v) => v.toLowerCase().trim());
    if (vals.some((v) => v === "data_operazione")) {
      headerRowIdx = i;
      headers = vals;
      break;
    }
  }
  if (headerRowIdx === -1) return "Header Fineco non trovato";

  const iDate = headers.findIndex((h) => h === "data_operazione");
  const iEntrate = headers.findIndex((h) => h === "entrate");
  const iUscite = headers.findIndex((h) => h === "uscite");
  const iDesc = headers.findIndex((h) => h === "descrizione");
  const iDescExt = headers.findIndex((h) => h === "descrizione_completa");

  if (iDate === -1 || iEntrate === -1 || iUscite === -1 || iDesc === -1)
    return `Colonne Fineco non trovate: ${headers.join(", ")}`;

  const rows: RawRow[] = [];
  for (let i = headerRowIdx + 1; i < allRows.length; i++) {
    // Mappa ref colonna → valore (gestisce celle sparse)
    const rowArr: string[] = [];
    for (const c of Array.from(allRows[i].querySelectorAll("c"))) {
      const ref = c.getAttribute("r") ?? "";
      rowArr[colLetterToIdx(ref)] = getCellValue(c);
    }

    const serialStr = rowArr[iDate];
    if (!serialStr || isNaN(Number(serialStr))) continue;

    const date = excelSerialToDate(Number(serialStr));
    if (isNaN(date.getTime())) continue;

    const entrate = parseFloat(rowArr[iEntrate] ?? "") || 0;
    const uscite = parseFloat(rowArr[iUscite] ?? "") || 0;
    const amount =
      entrate !== 0 ? entrate : uscite !== 0 ? -Math.abs(uscite) : 0;
    if (amount === 0) continue;

    const desc = (rowArr[iDesc] ?? "").trim();
    const descExt = iDescExt >= 0 ? (rowArr[iDescExt] ?? "").trim() : "";
    const description = descExt ? `${desc} - ${descExt}` : desc;
    if (!description) continue;

    rows.push({ date, description, amount });
  }

  return rows.length ? rows : "Nessuna riga Fineco riconosciuta";
}

// ── Hook principale ──────────────────────────────────────────────────────────

export function useXlsxParser(): UseParserReturn {
  const [status, setStatus] = useState<ParseStatus>("idle");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(
    (file: File, existingMappings: Record<string, string>) => {
      setStatus("parsing");
      setError(null);

      const finish = (rawRows: RawRow[]) => {
        const parsed: ParsedRow[] = rawRows.map((r) => {
          const normalizedDescription = normalize(r.description);
          const existingCategory =
            existingMappings[normalizedDescription] ?? null;
          return {
            ...r,
            normalizedDescription,
            category: existingCategory,
            autoMatched: existingCategory !== null,
          };
        });
        setRows(parsed);
        setStatus("done");
      };

      const fail = (msg: string) => {
        setError(msg);
        setStatus("error");
      };

      if (file.name.toLowerCase().endsWith(".csv")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const r = parseBnlCsv(e.target!.result as string);
          typeof r === "string" ? fail(r) : finish(r);
        };
        reader.onerror = () => fail("Impossibile leggere il file CSV.");
        reader.readAsText(file, "utf-8");
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const r = await parseFinecoXlsx(e.target!.result as ArrayBuffer);
            typeof r === "string" ? fail(r) : finish(r);
          } catch (err) {
            console.error(err);
            fail("Errore durante la lettura del file XLSX.");
          }
        };
        reader.onerror = () => fail("Impossibile leggere il file XLSX.");
        reader.readAsArrayBuffer(file);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setRows([]);
    setError(null);
  }, []);

  return { status, rows, error, parseFile, reset };
}
