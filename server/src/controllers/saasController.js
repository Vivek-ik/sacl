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
      .populate("owner", "name email phone role")
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

// GET /api/saas/admin/dashboard
export async function getSuperAdminDashboard(req, res) {
  try {
    const [
      totalOrganizations,
      activeOrganizations,
      suspendedOrganizations,
      totalUsers,
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      expiredSubscriptions,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: "active" }),
      Organization.countDocuments({ status: "suspended" }),
      User.countDocuments({ role: { $ne: "super_admin" } }),
      Subscription.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({ status: "trialing" }),
      Subscription.countDocuments({ status: "expired" }),
    ]);

    return res.json({
      success: true,
      stats: {
        totalOrganizations,
        activeOrganizations,
        suspendedOrganizations,
        totalUsers,
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
      },
    });
  } catch (error) {
    console.error("getSuperAdminDashboard:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load platform dashboard",
    });
  }
}

// GET /api/saas/admin/users
export async function listPlatformUsers(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const { search = "", role = "all", status = "all" } = req.query;

    const filter = {
      role: { $ne: "super_admin" },
    };

    if (role !== "all") {
      filter.role = role;
    }

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (search.trim()) {
      const regex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -__v")
        .populate("organization", "name slug status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("listPlatformUsers:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load platform users",
    });
  }
}

// PATCH /api/saas/admin/users/:id/status
export async function updatePlatformUserStatus(req, res) {
  try {
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status must be true or false",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: { $ne: "super_admin" },
      },
      { isActive: status },
      { new: true, runValidators: true },
    )
      .select("-password -__v")
      .populate("organization", "name slug");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      message: `User ${status ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    console.error("updatePlatformUserStatus:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
}

// GET /api/saas/admin/subscriptions
export async function listAllSubscriptions(req, res) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const { search = "", status = "all" } = req.query;

    const filter = {};

    if (status !== "all") {
      filter.status = status;
    }

    if (search.trim()) {
      const regex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      const matchingOrganizations = await Organization.find({
        $or: [{ name: regex }, { slug: regex }, { email: regex }],
      }).distinct("_id");

      filter.organization = { $in: matchingOrganizations };
    }

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("organization", "name slug email status")
        .populate("plan", "name code priceMonthlyPaise priceYearlyPaise")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("listAllSubscriptions:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load subscriptions",
    });
  }
}

// GET /api/saas/admin/plans
export async function listAdminPlans(req, res) {
  try {
    const plans = await SubscriptionPlan.find()
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("listAdminPlans:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load plans",
    });
  }
}

// POST /api/saas/admin/plans
export async function createPlan(req, res) {
  try {
    const {
      name,
      code,
      priceMonthlyPaise,
      priceYearlyPaise,
      trialDays = 0,
      limits = {},
      features = {},
      isActive = true,
    } = req.body;

    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Plan name and code are required",
      });
    }

    const normalizedCode = code.trim().toUpperCase();

    const existingPlan = await SubscriptionPlan.findOne({
      code: normalizedCode,
    });

    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: "A plan with this code already exists",
      });
    }

    const monthlyPrice = Number(priceMonthlyPaise);
    const yearlyPrice = Number(priceYearlyPaise);
    const trial = Number(trialDays);

    if (
      !Number.isFinite(monthlyPrice) ||
      monthlyPrice < 0 ||
      !Number.isFinite(yearlyPrice) ||
      yearlyPrice < 0 ||
      !Number.isInteger(trial) ||
      trial < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan pricing or trial duration",
      });
    }

    const plan = await SubscriptionPlan.create({
      name: name.trim(),
      code: normalizedCode,
      priceMonthlyPaise: monthlyPrice,
      priceYearlyPaise: yearlyPrice,
      trialDays: trial,
      limits,
      features,
      isActive: Boolean(isActive),
    });

    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("createPlan:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create plan",
    });
  }
}

// PATCH /api/saas/admin/plans/:id
export async function updatePlan(req, res) {
  try {
    const allowedFields = [
      "name",
      "priceMonthlyPaise",
      "priceYearlyPaise",
      "trialDays",
      "limits",
      "features",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Plan name cannot be empty",
        });
      }

      updates.name = updates.name.trim();
    }

    for (const field of ["priceMonthlyPaise", "priceYearlyPaise"]) {
      if (updates[field] !== undefined) {
        const value = Number(updates[field]);

        if (!Number.isFinite(value) || value < 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field}`,
          });
        }

        updates[field] = value;
      }
    }

    if (updates.trialDays !== undefined) {
      const value = Number(updates.trialDays);

      if (!Number.isInteger(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid trialDays",
        });
      }

      updates.trialDays = value;
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    return res.json({
      success: true,
      message: "Plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("updatePlan:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update plan",
    });
  }
}

// DELETE /api/saas/admin/plans/:id
// Soft-delete: deactivate rather than deleting a plan referenced by subscriptions.
export async function deletePlan(req, res) {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, runValidators: true },
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    return res.json({
      success: true,
      message: "Plan deactivated successfully",
      plan,
    });
  } catch (error) {
    console.error("deletePlan:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate plan",
    });
  }
}
