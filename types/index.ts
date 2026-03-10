import type { ExpenseCategory } from "@/lib/models/Expense";
import type { PaymentMethod } from "@/lib/models/Settlement";

export type { ExpenseCategory };
export type { PaymentMethod };

export const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string }
> = {
  food: { label: "Cibo", icon: "🍽️", color: "orange" },
  transport: { label: "Trasporti", icon: "🚗", color: "blue" },
  accommodation: { label: "Alloggio", icon: "🏠", color: "teal" },
  entertainment: { label: "Svago", icon: "🎬", color: "violet" },
  shopping: { label: "Shopping", icon: "🛍️", color: "pink" },
  utilities: { label: "Utenze", icon: "💡", color: "yellow" },
  health: { label: "Salute", icon: "🏥", color: "green" },
  other: { label: "Altro", icon: "📦", color: "gray" },
};

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: string }
> = {
  bank: { label: "Bonifico", icon: "🏦" },
  paypal: { label: "PayPal", icon: "🅿️" },
  satispay: { label: "Satispay", icon: "📱" },
  cash: { label: "Contanti", icon: "💵" },
  other: { label: "Altro", icon: "💳" },
};

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface SplitDTO {
  userId: string;
  userName: string;
  userImage?: string;
  percentage: number;
  amount: number;
  settled: boolean;
  settledAt?: string; // ISO string, presente se settled = true
}

export interface ExpenseDTO {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidBy: UserDTO;
  splits: SplitDTO[];
  notes?: string;
  recurringExpenseId?: string;
}

export interface GroupDTO {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  members: UserDTO[];
  isAdmin: boolean;
}

export interface BalanceEntry {
  user: UserDTO;
  amount: number; // positivo = mi deve, negativo = gli devo
}

export interface DashboardData {
  monthLabel: string;
  // mese corrente
  monthlyCount: number;
  monthlyTotal: number;
  monthlyOwedToMe: number;
  monthlyIOwe: number;
  // totale aperto (senza filtro data)
  totalOwedToMe: number;
  totalIOwe: number;
  netBalance: number;
  balances: BalanceEntry[];
}

// Una riga di spesa nel contesto 1-a-1
export interface PairExpenseRow {
  expenseId: string;
  description: string;
  category: string;
  date: string;
  totalAmount: number; // totale della spesa
  myShare: number; // la quota che mi riguarda
  paidByMe: boolean; // ho pagato io la spesa?
}

// Bilancio netto tra me e un'altra persona
export interface PairBalance {
  user: UserDTO; // l'altra persona
  netAmount: number; // positivo = mi deve, negativo = gli devo
  unsettledExpenses: PairExpenseRow[]; // spese aperte che compongono il saldo
}

export interface SettlementDTO {
  id: string;
  from: UserDTO;
  to: UserDTO;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  paidAt: string;
  note?: string;
}
