import mongoose, { Schema, Model } from "mongoose";

export interface IGroupMember {
  userId: mongoose.Types.ObjectId;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface IGroup {
  _id: mongoose.Types.ObjectId;
  name: string;
  emoji: string;
  currency: string;
  members: IGroupMember[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    emoji: { type: String, default: "💸" },
    currency: { type: String, default: "EUR" },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

GroupSchema.index({ "members.userId": 1 });

export const Group: Model<IGroup> =
  mongoose.models.Group ?? mongoose.model<IGroup>("Group", GroupSchema);
