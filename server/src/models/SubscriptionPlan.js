import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,

    priceMonthlyPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    priceYearlyPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },

    trialDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    limits: {
      tournaments: { type: Number, default: 1 },
      teams: { type: Number, default: 10 },
      playersPerTeam: { type: Number, default: 13 },
      users: { type: Number, default: 30 },
    },

    features: {
      auction: { type: Boolean, default: true },
      liveScoring: { type: Boolean, default: true },
      publicScoreboard: { type: Boolean, default: true },
      analytics: { type: Boolean, default: false },
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
