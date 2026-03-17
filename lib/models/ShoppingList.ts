import mongoose, { Schema, Model } from "mongoose";

export type ShoppingListStatus = "open" | "completed";

export interface IShoppingList {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  name: string;
  status: ShoppingListStatus;
  createdBy: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingListSchema = new Schema<IShoppingList>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "ShoppingGroup",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "completed"], default: "open" },
    createdBy: { type: String, required: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ShoppingListSchema.index({ groupId: 1, status: 1 });

export const ShoppingList: Model<IShoppingList> =
  mongoose.models.ShoppingList ??
  mongoose.model<IShoppingList>("ShoppingList", ShoppingListSchema);
