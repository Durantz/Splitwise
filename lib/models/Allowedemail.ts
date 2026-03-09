import mongoose, { Schema, Model } from "mongoose";

export interface IAllowedEmail {
  _id: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
}

const AllowedEmailSchema = new Schema<IAllowedEmail>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const AllowedEmail: Model<IAllowedEmail> =
  mongoose.models.AllowedEmail ??
  mongoose.model<IAllowedEmail>("AllowedEmail", AllowedEmailSchema);
