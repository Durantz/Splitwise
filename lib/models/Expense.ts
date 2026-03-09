import mongoose, { Schema, Model } from "mongoose";

export type ExpenseCategory =
  | "food" | "transport" | "accommodation"
  | "entertainment" | "shopping" | "utilities" | "health" | "other";

export interface ISplit {
  userId: mongoose.Types.ObjectId;
  percentage: number;
  amount: number;
  settled: boolean;
  settledAt?: Date;
}

export interface IExpense {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  paidBy: mongoose.Types.ObjectId;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  splits: ISplit[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["food", "transport", "accommodation", "entertainment", "shopping", "utilities", "health", "other"],
      default: "other",
    },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },
    splits: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        percentage: { type: Number, required: true },
        amount: { type: Number, required: true },
        settled: { type: Boolean, default: false },
        settledAt: Date,
        _id: false,
      },
    ],
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ groupId: 1, date: -1 });
ExpenseSchema.index({ groupId: 1, paidBy: 1 });
ExpenseSchema.index({ "splits.userId": 1, "splits.settled": 1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense ?? mongoose.model<IExpense>("Expense", ExpenseSchema);
