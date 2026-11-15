import mongoose from "mongoose";
const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    logo: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    primaryOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coOwnerName: String,
    coOwnerPhone: String,
    registrationFeeStatus: {
      type: String,
      enum: ["pending", "paid", "waived"],
      default: "pending",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    purseTotal: { type: Number, default: 50000 },
    purseRemaining: { type: Number, default: 50000 },
    squad: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true },
);
export default mongoose.model("Team", teamSchema);
