import mongoose, { Schema, Model } from "mongoose";

export interface IShoppingProduct {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  name: string; // normalizzato lowercase — es. "latte"
  displayName: string; // nome originale — es. "Latte"
  note: string; // nota normalizzata — es. "granarolo" (parte della chiave)
  displayNote: string; // nota originale — es. "Granarolo"
  count: number; // frequenza d'uso — ordina i suggerimenti
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
    note: { type: String, default: "", trim: true },
    displayNote: { type: String, default: "", trim: true },
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Chiave composita: stesso prodotto + stessa nota = voce separata nello storico
// "latte" e "latte+granarolo" sono suggerimenti distinti
ShoppingProductSchema.index({ groupId: 1, name: 1, note: 1 }, { unique: true });
ShoppingProductSchema.index({ groupId: 1, count: -1 });

export const ShoppingProduct: Model<IShoppingProduct> =
  mongoose.models.ShoppingProduct ??
  mongoose.model<IShoppingProduct>("ShoppingProduct", ShoppingProductSchema);
