import mongoose from "mongoose";
import Tournament from "../models/Tournament.js";

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
      // Do not allow the browser to create an already-live tournament.
      status: status === "upcoming" ? "upcoming" : "draft",
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
