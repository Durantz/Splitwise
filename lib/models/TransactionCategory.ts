import mongoose, { Schema, Model } from "mongoose";

export interface ITransactionCategory {
  _id: mongoose.Types.ObjectId;
  userId: string;
  description: string;
  normalizedDescription: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionCategorySchema = new Schema<ITransactionCategory>(
  {
    userId: { type: String, required: true, index: true },
    description: { type: String, required: true },
    normalizedDescription: { type: String, required: true },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

TransactionCategorySchema.index(
  { userId: 1, normalizedDescription: 1 },
  { unique: true }
);

export const TransactionCategory: Model<ITransactionCategory> =
  mongoose.models.TransactionCategory ??
  mongoose.model<ITransactionCategory>(
    "TransactionCategory",
    TransactionCategorySchema
  );
