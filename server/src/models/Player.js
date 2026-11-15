import mongoose from "mongoose";
const playerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: { type: String, required: true, trim: true },
    preferredTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    age: Number,
    category: {
      type: String,
      enum: ["ICONIC", "A", "B", "C", "D"],
      required: true,
    },
    role: {
      type: String,
      enum: ["BATTER", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"],
      required: true,
    },
    battingStyle: String,
    bowlingStyle: String,
    preferredJerseyNumber: Number,
    photo: String,
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
    auctionStatus: {
      type: String,
      enum: ["AVAILABLE", "IN_AUCTION", "SOLD", "UNSOLD"],
      default: "AVAILABLE",
    },
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    soldPrice: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export default mongoose.model("Player", playerSchema);
