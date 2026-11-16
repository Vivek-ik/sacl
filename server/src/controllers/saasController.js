import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import Organization from "../models/Organization.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Subscription from "../models/Subscription.js";
import jwt from "jsonwebtoken";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const addDays = (date, days) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

// POST /api/saas/organizations/register
export async function registerOrganization(req, res) {
  let organization;

  try {
    const { organizationName, adminName, email, password, phone } = req.body;

    if (!organizationName || !adminName || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Organization name, admin name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const plan = await SubscriptionPlan.findOne({
      code: "SACL_TRIAL",
      isActive: true,
    });

    if (!plan) {
      return res.status(500).json({
        success: false,
        message: "Trial plan is not configured",
      });
    }

    let slug = slugify(organizationName);
    const existingSlug = await Organization.exists({ slug });

    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-6)}`;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: adminName.trim(),
      email: normalizedEmail,
      password: passwordHash,
      phone,
      role: "org_admin",
      isActive: true,
    });

    try {
      organization = await Organization.create({
        name: organizationName.trim(),
        slug,
        email: normalizedEmail,
        phone,
        owner: user._id,
        createdBy: user._id,
        status: "active",
      });

      user.organization = organization._id;
      await user.save();

      const now = new Date();
      const trialEndsAt = addDays(now, plan.trialDays);

      const subscription = await Subscription.create({
        organization: organization._id,
        plan: plan._id,
        status: "trialing",
        billingCycle: "trial",
        startDate: now,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
      });

      const token = jwtToken(user);

      return res.status(201).json({
        success: true,
        message: "Organization registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: organization._id,
        },
        organization,
        subscription,
      });
    } catch (error) {
      await Organization.deleteOne({ _id: organization?._id });
      await User.deleteOne({ _id: user._id });
      throw error;
    }
  } catch (error) {
    console.error("registerOrganization:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Organization registration failed",
    });
  }
}

// Use the same JWT secret and payload convention as your existing login.
function jwtToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// GET /api/saas/plans
export async function getPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.find({
      isActive: true,
    }).select("-__v");

    return res.json({
      success: true,
      plans,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// GET /api/saas/subscription
export async function getMySubscription(req, res) {
  try {
    const subscription = await Subscription.findOne({
      organization: req.user.organization,
    }).populate("plan");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// GET /api/saas/admin/organizations
export async function listOrganizations(req, res) {
  try {
    const organizations = await Organization.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      organizations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// PATCH /api/saas/admin/organizations/:id/status
export async function updateOrganizationStatus(req, res) {
  try {
    const { status } = req.body;

    if (!["active", "suspended", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization status",
      });
    }

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.json({
      success: true,
      organization,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// PATCH /api/saas/admin/subscriptions/:id/status
export async function updateSubscriptionStatus(req, res) {
  try {
    const allowed = [
      "trialing",
      "active",
      "past_due",
      "grace_period",
      "expired",
      "cancelled",
    ];

    const { status } = req.body;

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription status",
      });
    }

    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(status === "cancelled" ? { cancelledAt: new Date() } : {}),
      },
      { new: true, runValidators: true },
    ).populate("organization plan");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    return res.json({
      success: true,
      subscription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
