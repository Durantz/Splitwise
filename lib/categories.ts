export const CATEGORIES = [
  { value: "stipendio", label: "💰 Stipendio", color: "green" },
  { value: "spesa", label: "🛒 Spesa", color: "lightblue" },
  { value: "cibo", label: "🍽️ Cibo", color: "orange" },
  { value: "casa", label: "🏠 Casa", color: "yellow" },
  { value: "utenze", label: "💡 Utenze", color: "cyan" },
  { value: "trasporti", label: "🚗 Trasporti", color: "blue" },
  { value: "svago", label: "🎬 Svago", color: "grape" },
  { value: "viaggi", label: "✈️ Viaggi", color: "indigo" },
  { value: "salute", label: "⚕️ Salute", color: "red" },
  { value: "abbigliamento", label: "👕 Abbigliamento", color: "pink" },
  { value: "acquisti", label: "🛍️ Acquisti", color: "teal" },
  { value: "servizi", label: "🔧 Servizi", color: "violet" },
  { value: "pagamenti", label: "💳 Pagamenti", color: "lime" },
  { value: "prelievi", label: "🏧 Prelievi", color: "gray" },
  { value: "altro", label: "📦 Altro", color: "dark" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

export function getCategoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getCategoryColor(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.color ?? "gray";
}
