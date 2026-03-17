import mongoose, { Schema, Model } from "mongoose";

export interface IShoppingProduct {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  name: string; // normalizzato lowercase trim
  displayName: string; // nome originale (prima occorrenza)
  count: number; // quante volte usato — per ordinare suggerimenti
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingProductSchema = new Schema<IShoppingProduct>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "ShoppingGroup",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

ShoppingProductSchema.index({ groupId: 1, name: 1 }, { unique: true });
ShoppingProductSchema.index({ groupId: 1, count: -1 });

export const ShoppingProduct: Model<IShoppingProduct> =
  mongoose.models.ShoppingProduct ??
  mongoose.model<IShoppingProduct>("ShoppingProduct", ShoppingProductSchema);
