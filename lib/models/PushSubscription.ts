import mongoose from "mongoose";

const schema = new mongoose.Schema({
  userId: { type: String, required: true },
  subscription: { type: Object, required: true }, // endpoint, keys...
  createdAt: { type: Date, default: Date.now },
});

export const PushSubscriptionModel =
  mongoose.models.PushSubscription ??
  mongoose.model("PushSubscription", schema);
