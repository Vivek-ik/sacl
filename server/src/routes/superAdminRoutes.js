import express from "express";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";

const router = express.Router();

router.use(protect, authorize("super_admin"));

// Platform dashboard
router.get("/dashboard", async (req, res, next) => {
  try {
    const [totalOrganizations, activeOrganizations, totalUsers] =
      await Promise.all([
        Organization.countDocuments(),
        Organization.countDocuments({ status: "active" }),
        User.countDocuments(),
      ]);

    res.json({
      success: true,
      stats: {
        totalOrganizations,
        activeOrganizations,
        totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// List organizations
router.get("/organizations", async (req, res, next) => {
  try {
    const organizations = await Organization.find()
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      organizations,
    });
  } catch (error) {
    next(error);
  }
});

// Get organization details
router.get("/organizations/:id", async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id).populate(
      "owner",
      "name email phone",
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    res.json({ success: true, organization });
  } catch (error) {
    next(error);
  }
});

// Suspend / reactivate organization
router.patch("/organizations/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization status",
      });
    }

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true },
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    res.json({
      success: true,
      organization,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
