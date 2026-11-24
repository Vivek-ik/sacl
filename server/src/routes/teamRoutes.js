import { protect } from "../middleware/auth.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import { Router } from "express";

const router = Router();

router.get("/my-team", protect, async (req, res, next) => {
  try {
    if (req.user.role !== "team_owner") {
      return res.status(403).json({
        success: false,
        message: "Only team owners can access this page",
      });
    }

    const team = await Team.findOne({
      owner: req.user.id,
    })
      .populate("owner", "name phone email")
      .populate({
        path: "squad",
        select:
          "fullName category role battingStyle bowlingStyle preferredJerseyNumber approvalStatus paymentStatus auctionStatus user",
        populate: {
          path: "user",
          select: "name phone email",
        },
      })
      .populate("tournament", "name season format startDate endDate venue")
      .lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "You have not registered a team yet",
      });
    }

    // Players who selected this team as their preferred team.
    // These are registrations, not confirmed squad members.
    const registrations = await Player.find({
      preferredTeam: team._id,
      tournament: team.tournament?._id || team.tournament,
    })
      .select(
        "fullName category role battingStyle bowlingStyle preferredJerseyNumber approvalStatus paymentStatus createdAt user",
      )
      .populate("user", "name phone email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      team,
      squad: team.squad || [],
      registrations,
      tournament: team.tournament,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
