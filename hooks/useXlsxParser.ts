"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

export interface RawRow {
  date: Date;
  description: string;
  amount: number;
}

export interface ParsedRow extends RawRow {
  normalizedDescription: string;
  category: string | null; // null = da categorizzare
  autoMatched: boolean;
}

export type ParseStatus = "idle" | "parsing" | "done" | "error";

interface UseXlsxParserReturn {
  status: ParseStatus;
  rows: ParsedRow[];
  error: string | null;
  parseFile: (file: File, existingMappings: Record<string, string>) => void;
  reset: () => void;
}

// Parser specifico per l'estratto conto BNL.
// Colonne attese: "Data contabile", "Data valuta", "Descrizione", "Dettaglio", importo (5a col senza header fisso)
function extractRow(raw: Record<string, unknown>): RawRow | null {
  const keys = Object.keys(raw);

  // Data: prima colonna che contiene "data"
  const dateKey =
    keys.find((k) => /data\s*contabile/i.test(k)) ??
    keys.find((k) => /data/i.test(k));

  // Descrizione: colonna "Descrizione"
  const descKey =
    keys.find((k) => /^descrizione$/i.test(k.trim())) ??
    keys.find((k) => /descri/i.test(k));

  // Dettaglio: colonna "Dettaglio" — lo concateniamo alla descrizione
  const detailKey = keys.find((k) => /^dettaglio$/i.test(k.trim()));

  // Importo: BNL lo chiama "Importo" oppure è l'ultima colonna numerica
  const amountKey =
    keys.find((k) => /^importo$/i.test(k.trim())) ??
    keys.find((k) => /importo|amount/i.test(k));

  if (!dateKey || !descKey) return null;

  // --- Parsing data ---
  // BNL usa il formato "27/2/2026" come stringa
  let date: Date;
  const rawDate = raw[dateKey];
  if (typeof rawDate === "number") {
    const d = XLSX.SSF.parse_date_code(rawDate) as {
      y: number;
      m: number;
      d: number;
    };
    date = new Date(d.y, d.m - 1, d.d);
  } else if (rawDate instanceof Date) {
    date = rawDate;
  } else {
    // "27/2/2026" -> new Date(2026, 1, 27)
    const str = String(rawDate).trim();
    const match = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (match) {
      date = new Date(
        parseInt(match[3]),
        parseInt(match[2]) - 1,
        parseInt(match[1])
      );
    } else {
      date = new Date(str);
    }
  }
  if (isNaN(date.getTime())) return null;

  // --- Descrizione ---
  const desc = String(raw[descKey] ?? "").trim();
  const detail = detailKey ? String(raw[detailKey] ?? "").trim() : "";
  // Combina descrizione e dettaglio per avere più contesto nella trascodifica
  const description = detail ? `${desc} - ${detail}` : desc;
  if (!description) return null;

  // --- Importo ---
  // SheetJS può restituire già un numero (es. -29.34) oppure una stringa "−29,34"
  let amount = 0;
  if (amountKey && raw[amountKey] !== "" && raw[amountKey] != null) {
    const val = raw[amountKey];
    if (typeof val === "number") {
      amount = val;
    } else {
      amount =
        parseFloat(
          String(val)
            .trim()
            .replace(/\./g, "") // rimuove separatore migliaia
            .replace(",", ".") // virgola decimale → punto
        ) || 0;
    }
  } else {
    // Fallback: ultima colonna con valore numerico
    const keys = Object.keys(raw);
    for (let i = keys.length - 1; i >= 0; i--) {
      const val = raw[keys[i]];
      if (typeof val === "number") {
        amount = val;
        break;
      }
      const parsed = parseFloat(
        String(val ?? "")
          .trim()
          .replace(/\./g, "")
          .replace(",", ".")
      );
      if (!isNaN(parsed) && String(val).trim() !== "") {
        amount = parsed;
        break;
      }
    }
  }

  return { date, description, amount };
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

export function useXlsxParser(): UseXlsxParserReturn {
  const [status, setStatus] = useState<ParseStatus>("idle");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(
    (file: File, existingMappings: Record<string, string>) => {
      setStatus("parsing");
      setError(null);

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];

          // BNL ha righe di intestazione prima della tabella vera.
          // Cerchiamo la riga che contiene "Descrizione" come header.
          const ref = sheet["!ref"];
          if (!ref) {
            setError("Foglio vuoto o non valido.");
            setStatus("error");
            return;
          }

          const range = XLSX.utils.decode_range(ref);
          let headerRow = 0;
          for (let r = range.s.r; r <= Math.min(range.e.r, 15); r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
              const cell = sheet[XLSX.utils.encode_cell({ r, c })];
              if (cell && /^descrizione$/i.test(String(cell.v ?? "").trim())) {
                headerRow = r;
                break;
              }
            }
            if (headerRow > 0) break;
          }

          // Imposta il range a partire dalla riga header trovata
          const newRange = { ...range, s: { ...range.s, r: headerRow } };
          sheet["!ref"] = XLSX.utils.encode_range(newRange);

          const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            sheet,
            {
              defval: "",
            }
          );

          const parsed: ParsedRow[] = [];
          for (const raw of rawRows) {
            const extracted = extractRow(raw);
            if (!extracted) continue;
            const normalizedDescription = normalize(extracted.description);
            const existingCategory =
              existingMappings[normalizedDescription] ?? null;
            parsed.push({
              ...extracted,
              normalizedDescription,
              category: existingCategory,
              autoMatched: existingCategory !== null,
            });
          }

          if (parsed.length === 0) {
            setError(
              "Nessuna riga riconosciuta. Controlla che il file sia un estratto conto valido."
            );
            setStatus("error");
            return;
          }

          setRows(parsed);
          setStatus("done");
        } catch {
          setError("Errore durante la lettura del file. Riprova.");
          setStatus("error");
        }
      };

      reader.onerror = () => {
        setError("Impossibile leggere il file.");
        setStatus("error");
      };

      reader.readAsArrayBuffer(file);
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
