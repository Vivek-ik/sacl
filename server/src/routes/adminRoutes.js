import { Router } from "express";
import {
  listApplications,
  reviewApplication,
} from "../controllers/adminController.js";
import { protect, allowRoles } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Match from "../models/Match.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";

const router = Router();
router.use(protect, allowRoles("admin"));
router.get("/applications", listApplications);
router.patch("/applications/:entity/:id", reviewApplication);

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

// GET /api/admin/scorers
router.get("/scorers", protect, adminOnly, async (req, res, next) => {
  try {
    const scorers = await User.find({ role: "scorer" })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const result = await Promise.all(
      scorers.map(async (scorer) => ({
        ...scorer,
        assignedMatchesCount: await Match.countDocuments({
          scorer: scorer._id,
        }),
      })),
    );

    res.json({
      success: true,
      scorers: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/scorers
router.post("/scorers", protect, adminOnly, async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const scorer = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      password: hashedPassword,
      role: role || "scorer",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Scorer created successfully",
      scorer: {
        _id: scorer._id,
        name: scorer.name,
        email: scorer.email,
        phone: scorer.phone,
        role: scorer.role,
        isActive: scorer.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/scorers/:id/status
router.patch(
  "/scorers/:id/status",
  protect,
  adminOnly,
  async (req, res, next) => {
    try {
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
        });
      }

      const scorer = await User.findOneAndUpdate(
        {
          _id: req.params.id,
          role: "scorer",
        },
        { $set: { isActive } },
        { new: true, runValidators: true },
      ).select("-password");

      if (!scorer) {
        return res.status(404).json({
          success: false,
          message: "Scorer not found",
        });
      }

      res.json({
        success: true,
        message: `Scorer ${isActive ? "activated" : "deactivated"} successfully`,
        scorer,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/admin/teams
router.get("/teams", async (req, res, next) => {
  try {
    const teams = await Team.find({
      approvalStatus: "approved",
    })
      .select("_id name owner coOwnerName")
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      teams,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users?role=scorer
router.get("/users", async (req, res, next) => {
  try {
    const { role } = req.query;

    const filter = {};

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select("_id name email phone role isActive")
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/players
router.get("/players", async (req, res, next) => {
  try {
    const players = await Player.find({
      approvalStatus: "approved",
    })
      .populate("user", "name email phone")
      .select(
        "_id fullName category role battingStyle bowlingStyle preferredJerseyNumber user",
      )
      .sort({ fullName: 1 })
      .lean();

    res.json({
      success: true,
      players,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
