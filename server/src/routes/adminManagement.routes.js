import { Router } from "express";
import mongoose from "mongoose";
import Player from "../models/Player.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import { protect, allowRoles } from "../middleware/auth.js";

import {
  sendPlayerApprovedEmail,
  sendPlayerRejectedEmail,
  sendTeamDecisionEmail,
} from "../services/emailService.js";

const router = Router();

router.use(protect, allowRoles("admin", "super_admin", "org_admin"));

const validStatuses = ["pending", "approved", "rejected"];
const validPayments = ["pending", "paid", "failed"];

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(query.limit, 10) || 20),
  );

  return { page, limit, skip: (page - 1) * limit };
}

function objectId(value) {
  return mongoose.isValidObjectId(value);
}

function buildFilter(query) {
  const filter = {};

  if (query.status && query.status !== "all") {
    if (!validStatuses.includes(query.status)) {
      throw new Error("Invalid approval status");
    }
    filter.approvalStatus = query.status;
  }

  if (query.payment && query.payment !== "all") {
    if (!validPayments.includes(query.payment)) {
      throw new Error("Invalid payment status");
    }
    filter.registrationFeeStatus = query.payment;
  }

  if (query.tournamentId) {
    if (!objectId(query.tournamentId)) {
      throw new Error("Invalid tournament ID");
    }
    filter.tournament = query.tournamentId;
  }

  return filter;
}

// GET /api/admin/players/management
router.get("/players/management", async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const { page, limit, skip } = pagination(req.query);

    if (req.query.category && req.query.category !== "all") {
      filter.category = req.query.category;
    }

    if (req.query.search?.trim()) {
      filter.fullName = {
        $regex: escapeRegex(req.query.search.trim()),
        $options: "i",
      };
    }

    const [players, total, totalPlayers, approved, pending, paid] =
      await Promise.all([
        Player.find(filter)
          .populate("user", "name email phone")
          .populate("tournament", "name season")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        Player.countDocuments(filter),
        Player.countDocuments(),
        Player.countDocuments({ approvalStatus: "approved" }),
        Player.countDocuments({ approvalStatus: "pending" }),
        Player.countDocuments({ registrationFeeStatus: "paid" }),
      ]);

    res.json({
      success: true,
      players,
      stats: {
        total: totalPlayers,
        approved,
        pending,
        paid,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error.message.startsWith("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

// GET /api/admin/teams/management
router.get("/teams/management", async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    const { page, limit, skip } = pagination(req.query);

    if (req.query.search?.trim()) {
      filter.name = {
        $regex: escapeRegex(req.query.search.trim()),
        $options: "i",
      };
    }

    const [teams, total, totalTeams, approved, pending, tournaments] =
      await Promise.all([
        Team.find(filter)
          .populate("owner", "name email phone")
          .populate("primaryOwner", "name email phone")
          .populate("tournament", "name season teamLimit")
          .select(
            "name owner primaryOwner tournament coOwnerName coOwnerPhone " +
              "approvalStatus registrationFeeStatus purseTotal " +
              "purseRemaining squad createdAt",
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        Team.countDocuments(filter),
        Team.countDocuments(),
        Team.countDocuments({ approvalStatus: "approved" }),
        Team.countDocuments({ approvalStatus: "pending" }),
        Tournament.find().select("teamLimit").lean(),
      ]);

    const capacity = tournaments.reduce(
      (sum, tournament) => sum + (tournament.teamLimit || 0),
      0,
    );

    res.json({
      success: true,
      teams,
      stats: {
        total: totalTeams,
        approved,
        pending,
        availableSlots: Math.max(0, capacity - approved - pending),
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error.message.startsWith("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
});

/**
 * PATCH /api/admin/:entity/:id/payment-status
 * Mark player/team registration fee as paid
 */
router.patch("/:entity/:id/payment-status", async (req, res, next) => {
  try {
    const { entity, id } = req.params;
    const { registrationFeeStatus } = req.body;

    // Validate entity
    if (!["players", "teams"].includes(entity)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application type",
      });
    }

    // Validate ID
    if (!objectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID",
      });
    }

    // Only allow marking as paid through this endpoint
    if (registrationFeeStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const Model = entity === "players" ? Player : Team;

    const application = await Model.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.approvalStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Only pending applications can have payment status updated",
      });
    }

    if (application.registrationFeeStatus === "paid") {
      return res.json({
        success: true,
        message: "Payment is already marked as paid",
        application,
      });
    }

    application.registrationFeeStatus = "paid";
    await application.save();

    return res.json({
      success: true,
      message: "Payment marked as paid successfully",
      application,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/players/:id/review
router.patch("/players/:id/review", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!objectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid player ID" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    if (player.approvalStatus !== "pending") {
      return res.status(409).json({
        message: "This application has already been reviewed",
      });
    }

    if (status === "approved" && player.registrationFeeStatus !== "paid") {
      return res.status(400).json({
        message: "Player must complete registration payment first",
      });
    }

    player.approvalStatus = status;
    await player.save();

    res.json({
      success: true,
      message: `Player ${status} successfully`,
      player,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/teams/:id/review
router.patch("/teams/:id/review", async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!objectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (team.approvalStatus !== "pending") {
      return res.status(409).json({
        message: "This application has already been reviewed",
      });
    }

    if (status === "approved" && team.registrationFeeStatus !== "paid") {
      return res.status(400).json({
        message: "Team must complete registration payment first",
      });
    }

    if (status === "approved") {
      const tournament = await Tournament.findById(team.tournament);

      if (!tournament) {
        return res.status(404).json({
          message: "Tournament not found",
        });
      }

      const approvedCount = await Team.countDocuments({
        tournament: team.tournament,
        approvalStatus: "approved",
      });

      if (approvedCount >= tournament.teamLimit) {
        return res.status(409).json({
          message: "Tournament team capacity is full",
        });
      }
    }

    team.approvalStatus = status;
    await team.save();

    res.json({
      success: true,
      message: `Team ${status} successfully`,
      team,
    });
  } catch (error) {
    next(error);
  }
});

// EDIT PLAYER OR TEAM
router.put("/applications/:entity/:id", async (req, res, next) => {
  try {
    const { entity, id } = req.params;

    if (!["player", "team"].includes(entity) || !isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application",
      });
    }

    const Model = entity === "player" ? Player : Team;

    const application = await Model.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    const allowedFields =
      entity === "player"
        ? [
            "fullName",
            "category",
            "role",
            "battingStyle",
            "bowlingStyle",
            "preferredJerseyNumber",
          ]
        : ["name", "coOwnerName", "coOwnerPhone"];

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

      const value = req.body[field];

      if (["fullName", "name"].includes(field)) {
        if (!String(value || "").trim()) {
          return res.status(400).json({
            success: false,
            message: `${field} is required`,
          });
        }

        application[field] = String(value).trim();
      } else if (field === "preferredJerseyNumber") {
        const number = Number(value);

        if (!Number.isInteger(number) || number < 1 || number > 99) {
          return res.status(400).json({
            success: false,
            message: "Jersey number must be between 1 and 99",
          });
        }

        application[field] = number;
      } else {
        application[field] = String(value ?? "").trim();
      }
    }

    await application.save();

    res.json({
      success: true,
      message: `${entity} updated successfully`,
      application,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE PLAYER OR TEAM APPLICATION
router.delete("/applications/:entity/:id", async (req, res, next) => {
  try {
    const { entity, id } = req.params;

    if (!["player", "team"].includes(entity) || !isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application",
      });
    }

    const Model = entity === "player" ? Player : Team;
    const application = await Model.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Preserve payment records and history.
    if (application.registrationFeeStatus === "paid") {
      return res.status(409).json({
        success: false,
        message: "Paid applications cannot be deleted.",
      });
    }

    // Do not delete teams with auctioned players.
    if (entity === "team") {
      const squadCount = await Player.countDocuments({
        team: application._id,
      });

      if (squadCount > 0 || application.squad?.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Cannot delete a team with assigned players.",
        });
      }
    }

    await application.deleteOne();

    res.json({
      success: true,
      message: `${entity} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// APPROVE OR REJECT APPLICATION

router.patch("/applications/:entity/:id", async (req, res, next) => {
  try {
    const { entity, id } = req.params;
    const { status, reason } = req.body;

    if (!["player", "team"].includes(entity) || !isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval status",
      });
    }

    const Model = entity === "player" ? Player : Team;

    // Load applicant and tournament details for the email.
    const application = await Model.findById(id)
      .populate(
        entity === "player" ? "user" : "primaryOwner",
        "name email phone",
      )
      .populate("tournament", "name season startDate endDate venue");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (application.approvalStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Only pending applications can be reviewed",
      });
    }

    if (status === "approved" && application.registrationFeeStatus !== "paid") {
      return res.status(409).json({
        success: false,
        message: "Verified payment is required before approval",
      });
    }

    if (entity === "team" && status === "approved") {
      const tournament = await Tournament.findById(
        application.tournament?._id || application.tournament,
      );

      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: "Tournament not found",
        });
      }

      const approvedCount = await Team.countDocuments({
        tournament: tournament._id,
        approvalStatus: "approved",
      });

      if (approvedCount >= tournament.teamLimit) {
        return res.status(409).json({
          success: false,
          message: "Tournament team limit reached",
        });
      }
    }

    // Save the decision first.
    application.approvalStatus = status;
    await application.save();

    // Send notification without failing the approval API
    // if the SMTP server is temporarily unavailable.
    const tournamentName =
      application.tournament?.name || "Samrat Ashok Cricket League";

    const applicant =
      entity === "player" ? application.user : application.primaryOwner;

    if (applicant?.email) {
      let emailPromise;

      if (entity === "player") {
        emailPromise =
          status === "approved"
            ? sendPlayerApprovedEmail({
                to: applicant.email,
                name: applicant.name || application.fullName,
                tournamentName,
                category: application.category,
              })
            : sendPlayerRejectedEmail({
                to: applicant.email,
                name: applicant.name || application.fullName,
                tournamentName,
                reason: reason || "",
              });
      } else {
        emailPromise = sendTeamDecisionEmail({
          to: applicant.email,
          ownerName: applicant.name,
          teamName: application.name,
          tournamentName,
          approved: status === "approved",
          reason: reason || "",
        });
      }

      emailPromise.catch((error) => {
        console.error(
          `Failed to send ${entity} ${status} email:`,
          error.message,
        );
      });
    }

    return res.json({
      success: true,
      message: `Application ${status} successfully`,
      application,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
