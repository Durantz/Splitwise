import mongoose, { Schema, Model } from "mongoose";
import type { ExpenseCategory } from "./Expense";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface IRecurringSplit {
  userId: mongoose.Types.ObjectId;
  percentage: number;
  amount: number;
}

export interface IRecurringExpense {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  paidBy: mongoose.Types.ObjectId;
  description: string;
  category: ExpenseCategory;
  amount: number;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  /**
   * L'ultima data per cui è già stata materializzata un'occorrenza.
   * Inizializzata a startDate - 1 giorno così la prima occorrenza viene
   * generata al primo accesso.
   */
  lastGeneratedAt: Date;
  splits: IRecurringSplit[];
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringSplitSchema = new Schema<IRecurringSplit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    percentage: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const RecurringExpenseSchema = new Schema<IRecurringExpense>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "food",
        "transport",
        "accommodation",
        "entertainment",
        "shopping",
        "utilities",
        "health",
        "other",
      ],
      default: "other",
    },
    amount: { type: Number, required: true, min: 0.01 },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    lastGeneratedAt: { type: Date, required: true },
    splits: [RecurringSplitSchema],
    notes: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

RecurringExpenseSchema.index({ groupId: 1, active: 1 });
RecurringExpenseSchema.index({ groupId: 1, paidBy: 1 });

export const RecurringExpense: Model<IRecurringExpense> =
  mongoose.models.RecurringExpense ??
  mongoose.model<IRecurringExpense>("RecurringExpense", RecurringExpenseSchema);
