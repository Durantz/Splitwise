import type { ExpenseCategory } from "@/lib/models/Expense";

export type { ExpenseCategory };

export const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string }
> = {
  food:          { label: "Cibo",           icon: "🍽️",  color: "orange" },
  transport:     { label: "Trasporti",      icon: "🚗",  color: "blue" },
  accommodation: { label: "Alloggio",       icon: "🏠",  color: "teal" },
  entertainment: { label: "Svago",          icon: "🎬",  color: "violet" },
  shopping:      { label: "Shopping",       icon: "🛍️",  color: "pink" },
  utilities:     { label: "Utenze",         icon: "💡",  color: "yellow" },
  health:        { label: "Salute",         icon: "🏥",  color: "green" },
  other:         { label: "Altro",          icon: "📦",  color: "gray" },
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
  monthlyCount: number;
  monthlyTotal: number;
  totalOwedToMe: number;
  totalIOwe: number;
  netBalance: number;
  balances: BalanceEntry[];
  monthLabel: string;
}
