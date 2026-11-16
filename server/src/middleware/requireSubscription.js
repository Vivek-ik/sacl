import Subscription from "../models/Subscription.js";

export async function requireSubscription(req, res, next) {
  try {
    if (!req.user?.organization) {
      return res.status(403).json({
        success: false,
        message: "Organization is required",
      });
    }

    const subscription = await Subscription.findOne({
      organization: req.user.organization,
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: "No subscription found",
      });
    }

    const now = new Date();

    // Automatically expire a trial that has ended.
    if (
      subscription.status === "trialing" &&
      subscription.trialEndsAt &&
      now > subscription.trialEndsAt
    ) {
      subscription.status = "grace_period";
      subscription.graceEndsAt = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      await subscription.save();
    }

    // Automatically expire a finished grace period.
    if (
      subscription.status === "grace_period" &&
      subscription.graceEndsAt &&
      now > subscription.graceEndsAt
    ) {
      subscription.status = "expired";
      await subscription.save();
    }

    if (["expired", "cancelled", "past_due"].includes(subscription.status)) {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_RESTRICTED",
        message: "Your subscription does not allow this action",
        subscriptionStatus: subscription.status,
      });
    }

    // Grace period is read-only.
    if (
      subscription.status === "grace_period" &&
      !["GET", "HEAD", "OPTIONS"].includes(req.method)
    ) {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_READ_ONLY",
        message: "Your grace period is read-only. Please renew your plan.",
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error("requireSubscription:", error);
    res.status(500).json({
      success: false,
      message: "Unable to verify subscription",
    });
  }
}
