import mongoose, { Schema, Model } from "mongoose";

export type PaymentMethod = "bank" | "paypal" | "satispay" | "cash" | "other";

export interface ISettlement {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  from: mongoose.Types.ObjectId; // chi paga
  to: mongoose.Types.ObjectId; // chi riceve
  amount: number;
  paymentMethod: PaymentMethod;
  paymentId?: string; // es. ID transazione banca/PP/Satispay
  paidAt: Date;
  note?: string;
  createdAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    from: { type: Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: {
      type: String,
      enum: ["bank", "paypal", "satispay", "cash", "other"],
      required: true,
    },
    paymentId: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

SettlementSchema.index({ groupId: 1, paidAt: -1 });
SettlementSchema.index({ groupId: 1, from: 1, to: 1 });

export const Settlement: Model<ISettlement> =
  mongoose.models.Settlement ??
  mongoose.model<ISettlement>("Settlement", SettlementSchema);
