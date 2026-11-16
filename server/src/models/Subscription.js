import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "trialing",
        "active",
        "past_due",
        "grace_period",
        "expired",
        "cancelled",
      ],
      default: "trialing",
      index: true,
    },

    billingCycle: {
      type: String,
      enum: ["monthly", "yearly", "trial"],
      default: "trial",
    },

    startDate: {
      type: Date,
      default: Date.now,
    },
    trialEndsAt: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    graceEndsAt: Date,
    cancelledAt: Date,

    paymentGateway: {
      type: String,
      enum: ["razorpay", "manual", null],
      default: null,
    },
    gatewayCustomerId: String,
    gatewaySubscriptionId: String,

    lastPaymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Subscription", subscriptionSchema);
