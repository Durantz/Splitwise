import { format } from "date-fns";
import { it } from "date-fns/locale";

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy", { locale: it });
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "d MMM", { locale: it });
}

export function calcEqualSplits(amount: number, memberIds: string[]) {
  const n = memberIds.length;
  const each = parseFloat((amount / n).toFixed(2));
  const pct = parseFloat((100 / n).toFixed(4));

  return memberIds.map((userId, i) => ({
    userId,
    percentage: i === n - 1 ? 100 - pct * (n - 1) : pct,
    amount: i === n - 1 ? parseFloat((amount - each * (n - 1)).toFixed(2)) : each,
  }));
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
