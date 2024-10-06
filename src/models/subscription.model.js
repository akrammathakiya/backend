import mongoose, { Schema } from "mongoose";

const subcriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.type.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.type.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subcription = mongoose.model("Subcription", subcriptionSchema);
