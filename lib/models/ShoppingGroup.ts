import mongoose, { Schema, Model } from "mongoose";

export interface IShoppingGroup {
  _id: mongoose.Types.ObjectId;
  name: string;
  adminId: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingGroupSchema = new Schema<IShoppingGroup>(
  {
    name: { type: String, required: true, trim: true },
    adminId: { type: String, required: true },
    memberIds: [{ type: String, required: true }],
  },
  { timestamps: true }
);

ShoppingGroupSchema.index({ memberIds: 1 });

export const ShoppingGroup: Model<IShoppingGroup> =
  mongoose.models.ShoppingGroup ??
  mongoose.model<IShoppingGroup>("ShoppingGroup", ShoppingGroupSchema);
