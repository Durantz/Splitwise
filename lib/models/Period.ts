import mongoose, { Schema, Model } from "mongoose";

export interface IPeriod {
  _id: mongoose.Types.ObjectId;
  userId: string;
  label: string;
  from: Date;
  to: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PeriodSchema = new Schema<IPeriod>(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Period: Model<IPeriod> =
  mongoose.models.Period ?? mongoose.model<IPeriod>("Period", PeriodSchema);
