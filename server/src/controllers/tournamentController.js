import mongoose from "mongoose";
import Tournament from "../models/Tournament.js";
import Player from "../models/Player.js";
import Team from "../models/Team.js";

export const createTournament = async (req, res, next) => {
  try {
    const {
      name,
      season,
      description,
      format,
      startDate,
      endDate,
      venue,
      city,
      teamLimit,
      squadSize,
      purseTotal,
      status,
    } = req.body;

    if (
      !name?.trim() ||
      !startDate ||
      !endDate ||
      teamLimit === undefined ||
      squadSize === undefined ||
      purseTotal === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required tournament fields.",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid tournament dates.",
      });
    }

    const teams = Number(teamLimit);
    const squad = Number(squadSize);
    const purse = Number(purseTotal);

    if (
      !Number.isInteger(teams) ||
      teams < 2 ||
      !Number.isInteger(squad) ||
      squad < 1 ||
      !Number.isFinite(purse) ||
      purse < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Team limit, squad size, or purse amount is invalid.",
      });
    }

    const tournament = await Tournament.create({
      organization: req.organizationId,
      createdBy: req.user._id,
      name: name.trim(),
      season: season?.trim() || "",
      description: description?.trim() || "",
      format: format || "T20",
      startDate: start,
      endDate: end,
      venue: venue?.trim() || "",
      city: city?.trim() || "",
      teamLimit: teams,
      squadSize: squad,
      purseTotal: purse,
      status: status === "upcoming" ? "upcoming" : "draft",
      approvalStatus: "pending",
      auctionStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully.",
      tournament,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A tournament with this name and season already exists.",
      });
    }
    next(error);
  }
};

export const getTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find({
      organization: req.organizationId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      tournaments,
    });
  } catch (error) {
    next(error);
  }
};

export const getTournamentById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID.",
      });
    }

    const tournament = await Tournament.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    return res.json({ success: true, tournament });
  } catch (error) {
    next(error);
  }
};

// APPROVE TOURNAMENT

export const approveTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID.",
      });
    }

    const tournament = await Tournament.findOne({
      _id: id,
      organization: req.organizationId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    if (tournament.approvalStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: `Tournament is already ${tournament.approvalStatus}.`,
      });
    }

    tournament.approvalStatus = "approved";
    await tournament.save();

    return res.json({
      success: true,
      message: "Tournament approved successfully.",
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// REJECT TOURNAMENT
export const rejectTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID.",
      });
    }

    const tournament = await Tournament.findOne({
      _id: id,
      organization: req.organizationId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    if (tournament.approvalStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: `Tournament is already ${tournament.approvalStatus}.`,
      });
    }

    tournament.approvalStatus = "rejected";

    await tournament.save();

    return res.json({
      success: true,
      message: "Tournament rejected successfully.",
      tournament,
    });
  } catch (error) {
    next(error);
  }
};

// EDIT TOURNAMENT
export const updateTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID.",
      });
    }

    const tournament = await Tournament.findOne({
      _id: id,
      organization: req.organizationId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    // Only these fields can be edited.
    // approvalStatus, organization, createdBy and auctionStatus
    // cannot be changed through this endpoint.
    const allowedFields = [
      "name",
      "season",
      "description",
      "format",
      "startDate",
      "endDate",
      "venue",
      "city",
      "teamLimit",
      "squadSize",
      "purseTotal",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    // Validate name
    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Tournament name is required.",
        });
      }

      updates.name = updates.name.trim();
    }

    // Normalize optional text fields
    for (const field of ["season", "description", "venue", "city"]) {
      if (updates[field] !== undefined) {
        if (typeof updates[field] !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be text.`,
          });
        }

        updates[field] = updates[field].trim();
      }
    }

    // Validate format
    if (updates.format !== undefined) {
      const allowedFormats = ["T10", "T20", "ODI", "TEST"];

      if (!allowedFormats.includes(updates.format)) {
        return res.status(400).json({
          success: false,
          message: "Invalid tournament format.",
        });
      }
    }

    // Validate dates using existing values when only one date is updated
    const start = new Date(updates.startDate ?? tournament.startDate);

    const end = new Date(updates.endDate ?? tournament.endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid tournament dates.",
      });
    }

    if (updates.startDate !== undefined) {
      updates.startDate = start;
    }

    if (updates.endDate !== undefined) {
      updates.endDate = end;
    }

    // Validate numeric fields
    if (updates.teamLimit !== undefined) {
      const value = Number(updates.teamLimit);

      if (!Number.isInteger(value) || value < 2) {
        return res.status(400).json({
          success: false,
          message: "Team limit must be an integer of at least 2.",
        });
      }

      updates.teamLimit = value;
    }

    if (updates.squadSize !== undefined) {
      const value = Number(updates.squadSize);

      if (!Number.isInteger(value) || value < 1) {
        return res.status(400).json({
          success: false,
          message: "Squad size must be a positive integer.",
        });
      }

      updates.squadSize = value;
    }

    if (updates.purseTotal !== undefined) {
      const value = Number(updates.purseTotal);

      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Purse amount must be zero or greater.",
        });
      }

      updates.purseTotal = value;
    }

    // Validate tournament lifecycle status
    if (updates.status !== undefined) {
      const allowedStatuses = [
        "draft",
        "upcoming",
        "active",
        "completed",
        "cancelled",
      ];

      if (!allowedStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid tournament status.",
        });
      }
    }

    Object.assign(tournament, updates);

    await tournament.save();

    return res.json({
      success: true,
      message: "Tournament updated successfully.",
      tournament,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A tournament with this name and season already exists.",
      });
    }

    next(error);
  }
};

// DELETE TOURNAMENT
export const deleteTournament = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tournament ID.",
      });
    }

    // Restrict deletion to the current organization.
    const tournament = await Tournament.findOne({
      _id: id,
      organization: req.organizationId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found.",
      });
    }

    // Preserve applications and team data.
    const [playerCount, teamCount] = await Promise.all([
      Player.countDocuments({ tournament: id }),
      Team.countDocuments({ tournament: id }),
    ]);

    if (playerCount > 0 || teamCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this tournament because player or team applications already exist.",
        playerCount,
        teamCount,
      });
    }

    await tournament.deleteOne();

    return res.json({
      success: true,
      message: "Tournament deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
