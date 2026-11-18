import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: false,
      index: true,
    },

    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

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
    preferredJerseySize: String,
    photo: String,

    registrationFeeStatus: {
      type: String,
      enum: ["pending", "paid", "waived"],
      default: "pending",
    },

    paymentVerificationStatus: {
      type: String,
      enum: ["not_submitted", "submitted", "approved", "rejected"],
      default: "not_submitted",
      index: true,
    },

    paymentUtr: {
      type: String,
      trim: true,
      default: null,
    },

    paymentScreenshot: {
      type: String,
      default: undefined,
    },

    paymentScreenshotPublicId: {
      type: String,
      default: undefined,
    },
    paymentSubmittedAt: {
      type: Date,
      default: null,
    },

    paymentReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paymentReviewedAt: {
      type: Date,
      default: null,
    },

    paymentRejectionReason: {
      type: String,
      trim: true,
      default: "",
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

    soldPrice: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Player", playerSchema);
