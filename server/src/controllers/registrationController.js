import Player from "../models/Player.js";
import Team from "../models/Team.js";
import { AUCTION_RULES } from "../config/auctionRules.js";
import Tournament from "../models/Tournament.js";

export async function registerPlayer(req, res, next) {
  try {
    const {
      tournamentId,
      fullName,
      category,
      role,
      battingStyle,
      bowlingStyle,
      preferredJerseyNumber,
      preferredJerseySize,
    } = req.body;

    if (
      !tournamentId ||
      !fullName?.trim() ||
      !category ||
      !role ||
      !battingStyle ||
      !bowlingStyle ||
      !preferredJerseyNumber ||
      !preferredJerseySize
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required player details",
      });
    }

    // Verify tournament
    const tournament = await Tournament.findOne({
      _id: tournamentId,
      status: ["draft", "upcoming", "active"],
    });

    if (!tournament) {
      return res.status(400).json({
        success: false,
        message: "Tournament is unavailable for registration",
      });
    }

    // Prevent duplicate player applications for this tournament
    const existingPlayer = await Player.findOne({
      user: req.user._id,
      tournament: tournament._id,
    });

    if (existingPlayer) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this tournament",
        player: existingPlayer,
      });
    }

    // Create player application for auction pool
    const player = await Player.create({
      user: req.user._id,
      tournament: tournament._id,

      fullName: fullName.trim(),
      category,
      role,
      battingStyle,
      bowlingStyle,
      preferredJerseyNumber: Number(preferredJerseyNumber),
      preferredJerseySize,

      // No team assignment during registration
      approvalStatus: "pending",
      registrationFeeStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Player application submitted successfully",
      player,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerTeam(req, res, next) {
  try {
    const { tournamentId, name, coOwnerName, coOwnerPhone } = req.body;

    if (!tournamentId || !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tournament and team name are required",
      });
    }

    // Find the selected tournament.
    const tournament = await Tournament.findOne({
      _id: tournamentId,
      status: "upcoming",
    });

    if (!tournament) {
      return res.status(400).json({
        success: false,
        message: "Tournament is unavailable for registration",
      });
    }

    // Prevent duplicate applications by this owner
    // for the same tournament.
    const existingApplication = await Team.findOne({
      primaryOwner: req.user._id,
      tournament: tournament._id,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this tournament",
        team: existingApplication,
      });
    }

    // Check tournament capacity.
    const applicationCount = await Team.countDocuments({
      tournament: tournament._id,
      approvalStatus: { $in: ["pending", "approved"] },
    });

    if (applicationCount >= tournament.teamLimit) {
      return res.status(400).json({
        success: false,
        message: "This tournament has reached its team limit",
      });
    }

    // Organization is always derived from the tournament.
    const team = await Team.create({
      name: name.trim(),
      owner: req.user._id,
      primaryOwner: req.user._id,
      organization: tournament.organization,
      tournament: tournament._id,
      coOwnerName: coOwnerName?.trim() || "",
      coOwnerPhone: coOwnerPhone?.trim() || "",
      approvalStatus: "pending",
      registrationFeeStatus: "pending",
      purseTotal: tournament.purseTotal ?? AUCTION_RULES.teamPurse,
      purseRemaining: tournament.purseTotal ?? AUCTION_RULES.teamPurse,
    });

    res.status(201).json({
      success: true,
      message: "Team application submitted successfully",
      team,
    });
  } catch (error) {
    next(error);
  }
}

export async function myTeamApplications(req, res, next) {
  try {
    const teams = await Team.find({
      primaryOwner: req.user._id,
    })
      .populate("tournament", "name season startDate endDate venue city status")
      .populate("organization", "name")
      .populate("squad", "fullName category role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      applications: teams,
    });
  } catch (error) {
    next(error);
  }
}

export async function myRegistration(req, res, next) {
  try {
    const [player, team] = await Promise.all([
      Player.findOne({
        user: req.user._id,
      }).populate("tournament", "name season status"),

      Team.findOne({
        primaryOwner: req.user._id,
      })
        .populate("tournament", "name season status")
        .populate("squad", "fullName category role"),
    ]);

    res.json({ player, team });
  } catch (error) {
    next(error);
  }
}
