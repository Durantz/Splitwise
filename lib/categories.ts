export const CATEGORIES = [
  { value: "stipendio", label: "💰 Stipendio", color: "green.5" },
  { value: "entrate", label: "💵 Altre Entrate", color: "green.9" },
  { value: "spesa", label: "🛒 Spesa", color: "blue.4" },
  { value: "cibo", label: "🍽️ Cibo", color: "orange" },
  { value: "casa", label: "🏠 Casa", color: "yellow" },
  { value: "utenze", label: "💡 Utenze", color: "cyan" },
  { value: "trasporti", label: "🚗 Trasporti", color: "blue" },
  { value: "svago", label: "🎬 Svago", color: "grape" },
  { value: "viaggi", label: "✈️ Viaggi", color: "indigo" },
  { value: "salute", label: "💊 Salute e Bellezza", color: "red" },
  { value: "abbigliamento", label: "👕 Abbigliamento", color: "pink" },
  { value: "acquisti", label: "🛍️ E-Commerce", color: "teal" },
  { value: "servizi", label: "🔧 Servizi", color: "violet" },
  { value: "animali", label: "🐶 Animali Domestici", color: "violet.9" },
  { value: "pagamenti", label: "💳 Pagamenti", color: "lime" },
  { value: "prestiti", label: "👛 Prestiti", color: "lime.9" },
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
