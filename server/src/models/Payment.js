import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    kind: {
      type: String,
      enum: ["player"],
      required: true,
    },
    merchantOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    phonePeOrderId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true, // paise
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    redirectUrl: String,
    transactionId: String,
    paymentMode: String,
    paidAt: Date,
    rawStatusResponse: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
