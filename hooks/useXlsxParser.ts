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

interface UseCsvParserReturn {
  status: ParseStatus;
  rows: ParsedRow[];
  error: string | null;
  parseFile: (file: File, existingMappings: Record<string, string>) => void;
  reset: () => void;
}

function parseDate(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (!m) return null;
  return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
}

function parseAmount(s: string): number {
  return (
    parseFloat(
      s
        .trim()
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^0-9.\-+]/g, "")
    ) || 0
  );
}

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
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

export function useXlsxParser(): UseCsvParserReturn {
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
          const text = e.target!.result as string;
          const lines = text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

          // Trova la riga header cercando "Data contabile"
          let headerIdx = -1;
          let headers: string[] = [];
          for (let i = 0; i < Math.min(lines.length, 15); i++) {
            const cols = parseCsvLine(lines[i]);
            if (cols.some((c) => /data\s*contabile/i.test(c))) {
              headerIdx = i;
              headers = cols.map((c) => c.toLowerCase().trim());
              break;
            }
          }

          if (headerIdx === -1) {
            setError(
              "Intestazione non trovata. Assicurati che il file CSV sia un estratto BNL."
            );
            setStatus("error");
            return;
          }

          const iDate = headers.findIndex((h) => /data\s*contabile/i.test(h));
          const iDesc = headers.findIndex((h) => /^descrizione$/i.test(h));
          const iDetail = headers.findIndex((h) => /^dettaglio$/i.test(h));
          const iAmount = headers.findIndex((h) => /^importo$/i.test(h));

          if (iDate === -1 || iDesc === -1 || iAmount === -1) {
            setError(
              `Colonne non trovate. Header rilevato: ${headers.join(", ")}`
            );
            setStatus("error");
            return;
          }

          const parsed: ParsedRow[] = [];

          for (let i = headerIdx + 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            if (cols.length < Math.max(iDate, iDesc, iAmount) + 1) continue;

            const date = parseDate(cols[iDate]);
            if (!date || isNaN(date.getTime())) continue;

            const desc = cols[iDesc].trim();
            const detail = iDetail >= 0 ? cols[iDetail].trim() : "";
            const description = detail ? `${desc} - ${detail}` : desc;
            if (!description) continue;

            const amount = parseAmount(cols[iAmount]);
            if (amount === 0) continue;

            const normalizedDescription = normalize(description);
            const existingCategory =
              existingMappings[normalizedDescription] ?? null;

            parsed.push({
              date,
              description,
              amount,
              normalizedDescription,
              category: existingCategory,
              autoMatched: existingCategory !== null,
            });
          }

          if (parsed.length === 0) {
            setError(
              "Nessuna riga riconosciuta. Controlla che il file sia un estratto conto BNL valido."
            );
            setStatus("error");
            return;
          }

          setRows(parsed);
          setStatus("done");
        } catch (err) {
          console.error("CSV parse error:", err);
          setError("Errore durante la lettura del file.");
          setStatus("error");
        }
      };

      reader.onerror = () => {
        setError("Impossibile leggere il file.");
        setStatus("error");
      };

      reader.readAsText(file, "utf-8");
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
