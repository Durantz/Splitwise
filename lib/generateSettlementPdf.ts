import type { SettlementHistoryEntry } from "@/app/(app)/settlements/server";
import { PAYMENT_METHOD_META } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatEur(value: number, currency = "EUR") {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export async function generateSettlementPdf(
  entry: SettlementHistoryEntry,
  currency = "EUR"
) {
  // Import dinamico: jsPDF non è compatibile con SSR
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const MARGIN = 20;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const text = (
    str: string,
    x: number,
    opts?: {
      align?: "left" | "right" | "center";
      size?: number;
      bold?: boolean;
      color?: [number, number, number];
    }
  ) => {
    const {
      align = "left",
      size = 10,
      bold = false,
      color = [30, 30, 30],
    } = opts ?? {};
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(str, x, y, { align });
  };

  const line = (color: [number, number, number] = [200, 200, 200]) => {
    doc.setDrawColor(...color);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 5;
  };

  const skip = (mm = 4) => {
    y += mm;
  };

  const row = (
    label: string,
    value: string,
    opts?: { valueBold?: boolean; valueColor?: [number, number, number] }
  ) => {
    text(label, MARGIN, { size: 9, color: [120, 120, 120] });
    text(value, PAGE_W - MARGIN, {
      align: "right",
      size: 9,
      bold: opts?.valueBold,
      color: opts?.valueColor ?? [30, 30, 30],
    });
    y += 5;
  };

  // ── Titolo ─────────────────────────────────────────────────────────────────

  text("RICEVUTA DI PAGAMENTO", MARGIN, {
    size: 18,
    bold: true,
    color: [20, 20, 20],
  });
  y += 8;

  const displayId = entry.paymentId ?? `#${entry.id.slice(-6).toUpperCase()}`;
  text(displayId, MARGIN, { size: 10, color: [100, 100, 100] });
  y += 3;

  line([220, 220, 220]);

  // ── Dati pagamento ─────────────────────────────────────────────────────────

  skip(2);
  row("Data pagamento", formatDate(entry.paidAt));
  row("Da", entry.from.name, { valueBold: true });
  row("A", entry.to.name, { valueBold: true });

  const payMeta = PAYMENT_METHOD_META[entry.paymentMethod];
  row("Metodo", `${payMeta.icon} ${payMeta.label}`);

  if (entry.paymentId) {
    row("ID transazione", entry.paymentId, { valueColor: [60, 100, 180] });
  }

  if (entry.note) {
    row("Note", entry.note);
  }

  skip(3);
  line([200, 200, 200]);

  // ── Importo totale ─────────────────────────────────────────────────────────

  skip(3);
  text("IMPORTO TOTALE", MARGIN, { size: 9, color: [120, 120, 120] });
  text(formatEur(entry.amount, currency), PAGE_W - MARGIN, {
    align: "right",
    size: 16,
    bold: true,
    color: [20, 140, 80],
  });
  y += 8;

  // ── Dettaglio spese ────────────────────────────────────────────────────────

  if (entry.settledExpenses.length > 0) {
    line([200, 200, 200]);
    skip(3);

    text("DETTAGLIO SPESE SALDATO", MARGIN, {
      size: 9,
      bold: true,
      color: [80, 80, 80],
    });
    y += 6;

    // Intestazione tabella
    doc.setFillColor(240, 240, 240);
    doc.rect(MARGIN, y - 4, CONTENT_W, 6, "F");

    text("Descrizione", MARGIN + 2, {
      size: 8,
      bold: true,
      color: [60, 60, 60],
    });
    text("Data", MARGIN + 90, { size: 8, bold: true, color: [60, 60, 60] });
    text("Totale", MARGIN + 125, { size: 8, bold: true, color: [60, 60, 60] });
    text("Quota", PAGE_W - MARGIN - 2, {
      align: "right",
      size: 8,
      bold: true,
      color: [60, 60, 60],
    });
    y += 4;

    // Righe spese
    entry.settledExpenses.forEach((exp, i) => {
      // Sfondo alternato leggero
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(MARGIN, y - 3.5, CONTENT_W, 6, "F");
      }

      // Tronca la descrizione se troppo lunga
      const desc =
        exp.description.length > 38
          ? exp.description.slice(0, 36) + "…"
          : exp.description;

      text(desc, MARGIN + 2, { size: 8 });
      text(formatDate(exp.date), MARGIN + 90, {
        size: 8,
        color: [100, 100, 100],
      });
      text(formatEur(exp.totalAmount, currency), MARGIN + 125, {
        size: 8,
        color: [100, 100, 100],
      });
      text(formatEur(exp.share, currency), PAGE_W - MARGIN - 2, {
        align: "right",
        size: 8,
        bold: true,
      });

      y += 6;

      // Nuova pagina se necessario
      if (y > 270) {
        doc.addPage();
        y = MARGIN;
      }
    });

    // Totale spese
    skip(2);
    doc.setFillColor(230, 245, 235);
    doc.rect(MARGIN, y - 3.5, CONTENT_W, 7, "F");
    text("Totale quote saldato", MARGIN + 2, { size: 9, bold: true });
    const totaleQuote = entry.settledExpenses.reduce(
      (acc, e) => acc + e.share,
      0
    );
    text(formatEur(totaleQuote, currency), PAGE_W - MARGIN - 2, {
      align: "right",
      size: 9,
      bold: true,
      color: [20, 140, 80],
    });
    y += 7;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  const footerY = 285;
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, footerY, PAGE_W - MARGIN, footerY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Documento generato il ${new Date().toLocaleDateString(
      "it-IT"
    )} · ${displayId}`,
    PAGE_W / 2,
    footerY + 4,
    { align: "center" }
  );

  // ── Download ───────────────────────────────────────────────────────────────

  const filename = `pagamento-${displayId.replace(
    "#",
    ""
  )}-${entry.paidAt.slice(0, 10)}.pdf`;
  doc.save(filename);
}
