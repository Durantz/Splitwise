import mongoose, { Schema, Model } from "mongoose";

export interface ITransaction {
  _id: mongoose.Types.ObjectId;
  userId: string;
  periodId: mongoose.Types.ObjectId;
  date: Date;
  amount: number; // positivo = entrata, negativo = uscita
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true, index: true },
    periodId: {
      type: Schema.Types.ObjectId,
      ref: "Period",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, periodId: 1, category: 1 });
TransactionSchema.index({ userId: 1, date: 1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ??
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
