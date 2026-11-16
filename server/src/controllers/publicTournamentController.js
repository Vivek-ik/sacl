import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";

const publicFields =
  "name season description format startDate endDate venue city teamLimit squadSize purseTotal status auctionStatus organization";

async function getTournamentAvailability(tournament) {
  const registeredTeams = await Team.countDocuments({
    tournament: tournament._id,
    approvalStatus: { $in: ["pending", "approved"] },
  });

  return {
    ...tournament.toObject(),
    registeredTeams,
    spotsRemaining: Math.max(0, tournament.teamLimit - registeredTeams),
    canApply:
      tournament.status === "upcoming" &&
      registeredTeams < tournament.teamLimit,
  };
}

// GET /api/public/tournaments
export async function getPublicTournaments(req, res, next) {
  try {
    const tournaments = await Tournament.find({
      status: { $in: ["upcoming", "active"] },
    })
      .select(publicFields)
      .populate("organization", "name")
      .sort({ startDate: 1 })
      .lean();

    const results = await Promise.all(
      tournaments.map(async (tournament) => {
        const registeredTeams = await Team.countDocuments({
          tournament: tournament._id,
          approvalStatus: { $in: ["pending", "approved"] },
        });

        return {
          ...tournament,
          registeredTeams,
          spotsRemaining: Math.max(0, tournament.teamLimit - registeredTeams),
          canApply:
            tournament.status === "upcoming" &&
            registeredTeams < tournament.teamLimit,
        };
      }),
    );

    res.json({
      success: true,
      tournaments: results,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/public/tournaments/:id
export async function getPublicTournamentById(req, res, next) {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.id,
      status: { $in: ["upcoming", "active"] },
    })
      .select(publicFields)
      .populate("organization", "name");

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const result = await getTournamentAvailability(tournament);

    res.json({
      success: true,
      tournament: result,
    });
  } catch (error) {
    next(error);
  }
}
