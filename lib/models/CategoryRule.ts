import mongoose, { Schema, Model } from "mongoose";

export interface ICategoryRule {
  _id: mongoose.Types.ObjectId;
  userId: string;
  pattern: string; // wildcard: * = qualsiasi sequenza
  category: string;
  priority: number; // ordine di applicazione, 1 = più alta
  overridesExact: boolean; // se true, vince anche sui mapping esatti
  createdAt: Date;
  updatedAt: Date;
}

const CategoryRuleSchema = new Schema<ICategoryRule>(
  {
    userId: { type: String, required: true, index: true },
    pattern: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: Number, required: true, default: 10 },
    overridesExact: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CategoryRuleSchema.index({ userId: 1, priority: 1 });

export const CategoryRule: Model<ICategoryRule> =
  mongoose.models.CategoryRule ??
  mongoose.model<ICategoryRule>("CategoryRule", CategoryRuleSchema);
