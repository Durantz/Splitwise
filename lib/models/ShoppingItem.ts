import mongoose, { Schema, Model } from "mongoose";

export interface IShoppingItem {
  _id: mongoose.Types.ObjectId;
  listId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string; // es. "kg", "pz", "l" — stringa libera
  note: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: Date;
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingItemSchema = new Schema<IShoppingItem>(
  {
    listId: {
      type: Schema.Types.ObjectId,
      ref: "ShoppingList",
      required: true,
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "ShoppingGroup",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "", trim: true },
    note: { type: String, default: "", trim: true },
    checked: { type: Boolean, default: false },
    checkedBy: { type: String },
    checkedAt: { type: Date },
    addedBy: { type: String, required: true },
  },
  { timestamps: true }
);

ShoppingItemSchema.index({ listId: 1, checked: 1 });

export const ShoppingItem: Model<IShoppingItem> =
  mongoose.models.ShoppingItem ??
  mongoose.model<IShoppingItem>("ShoppingItem", ShoppingItemSchema);
