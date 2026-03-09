import mongoose, { Schema, Model } from "mongoose";

export interface ISettlement {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  amount: number;
  note?: string;
  date: Date;
  createdAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SettlementSchema.index({ groupId: 1, date: -1 });

export const Settlement: Model<ISettlement> =
  mongoose.models.Settlement ??
  mongoose.model<ISettlement>("Settlement", SettlementSchema);
