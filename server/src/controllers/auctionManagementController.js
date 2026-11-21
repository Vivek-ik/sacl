import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import User from "../models/User.js";

const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);

const MANAGER_ROLES = ["super_admin", "org_admin", "admin"];

const isOrgManager = (role) => MANAGER_ROLES.includes(role);

async function getTournamentForManager(user, tournamentId) {
  if (!mongoose.isValidObjectId(tournamentId)) {
    throw fail("Invalid tournament ID", 400);
  }

  const tournament = await Tournament.findById(tournamentId);

  if (!tournament) {
    throw fail("Tournament not found", 404);
  }

  if (
    user.role !== "super_admin" &&
    !sameId(user.organization, tournament.organization)
  ) {
    throw fail("You cannot manage auctions for this organization", 403);
  }

  return tournament;
}

function canViewTournament(user, tournament) {
  if (user.role === "super_admin") return true;

  if (isOrgManager(user.role)) {
    return sameId(user.organization, tournament.organization);
  }

  if (user.role === "auctioneer") {
    return (
      sameId(user.organization, tournament.organization) &&
      (tournament.auctioneers || []).some((id) => sameId(id, user._id))
    );
  }

  return false;
}

// GET /api/auction-management
export async function listAuctionManagement(req, res, next) {
  try {
    const user = req.user;
    let tournamentFilter = {};

    if (user.role === "super_admin") {
      tournamentFilter = {};
    } else if (isOrgManager(user.role)) {
      tournamentFilter.organization = user.organization;
    } else if (user.role === "auctioneer") {
      tournamentFilter = {
        organization: user.organization,
        auctioneers: user._id,
      };
    } else if (user.role === "team_owner") {
      const tournamentIds = await Team.distinct("tournament", {
        primaryOwner: user._id,
        approvalStatus: "approved",
      });

      tournamentFilter._id = { $in: tournamentIds };
    } else {
      throw fail("You cannot view tournament auctions", 403);
    }

    const tournaments = await Tournament.find(tournamentFilter)
      .select(
        "name season organization status auctionStatus auctioneers startDate endDate",
      )
      .populate("organization", "name logo")
      .populate("auctioneers", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const tournamentIds = tournaments.map((t) => t._id);

    const auctions = await Auction.find({
      tournament: { $in: tournamentIds },
    })
      .select(
        "organization tournament auctionName status createdBy assignedAuctioneers scheduledAt timerSeconds createdAt updatedAt",
      )
      .populate("createdBy", "name")
      .populate("assignedAuctioneers", "name email")
      .lean();

    const auctionMap = new Map(
      auctions.map((auction) => [String(auction.tournament), auction]),
    );

    const rows = tournaments.map((tournament) => ({
      tournament,
      auction: auctionMap.get(String(tournament._id)) || null,
      canManage:
        isOrgManager(user.role) &&
        (user.role === "super_admin" ||
          sameId(
            user.organization,
            tournament.organization?._id || tournament.organization,
          )),
      canOperate:
        user.role === "super_admin" ||
        isOrgManager(user.role) ||
        (user.role === "auctioneer" &&
          (tournament.auctioneers || []).some((id) => sameId(id, user._id))),
    }));

    res.json({ auctions: rows });
  } catch (error) {
    next(error);
  }
}

// GET /api/auction-management/setup-options
export async function getAuctionSetupOptions(req, res, next) {
  try {
    if (!isOrgManager(req.user.role)) {
      throw fail("Only organization admins can configure auctions", 403);
    }

    const organizationFilter =
      req.user.role === "super_admin"
        ? {}
        : { organization: req.user.organization };

    const [tournaments, auctioneers] = await Promise.all([
      Tournament.find(organizationFilter)
        .select("name season organization status auctionStatus")
        .sort({ createdAt: -1 })
        .lean(),

      User.find({
        ...organizationFilter,
        role: "auctioneer",
        isActive: true,
      })
        .select("name email phone organization")
        .sort({ name: 1 })
        .lean(),
    ]);

    res.json({ tournaments, auctioneers });
  } catch (error) {
    next(error);
  }
}

// POST /api/auction-management
export async function createOrUpdateAuction(req, res, next) {
  try {
    if (!isOrgManager(req.user.role)) {
      throw fail("Only organization admins can create auctions", 403);
    }

    const {
      tournamentId,
      auctionName,
      auctioneerIds = [],
      scheduledAt = null,
      timerSeconds = 45,
      minimumReservePerSlot = 0,
    } = req.body;

    const tournament = await getTournamentForManager(req.user, tournamentId);

    if (!Array.isArray(auctioneerIds)) {
      throw fail("auctioneerIds must be an array");
    }

    const cleanIds = [...new Set(auctioneerIds.map(String))];

    if (cleanIds.some((id) => !mongoose.isValidObjectId(id))) {
      throw fail("One or more auctioneer IDs are invalid");
    }

    const validAuctioneers = await User.find({
      _id: { $in: cleanIds },
      role: "auctioneer",
      isActive: true,
      organization: tournament.organization,
    }).select("_id");

    if (validAuctioneers.length !== cleanIds.length) {
      throw fail(
        "All assigned auctioneers must be active auctioneers in this organization",
        400,
      );
    }

    const seconds = Number(timerSeconds);
    const reserve = Number(minimumReservePerSlot);

    if (!Number.isInteger(seconds) || seconds < 5 || seconds > 300) {
      throw fail("Timer must be between 5 and 300 seconds");
    }

    if (!Number.isFinite(reserve) || reserve < 0) {
      throw fail("Minimum reserve must be zero or greater");
    }

    const parsedSchedule = scheduledAt ? new Date(scheduledAt) : null;

    if (parsedSchedule && Number.isNaN(parsedSchedule.getTime())) {
      throw fail("Invalid scheduled date");
    }

    let auction = await Auction.findOne({
      organization: tournament.organization,
      tournament: tournament._id,
    });

    const isCreating = !auction;

    if (auction?.status === "RUNNING") {
      throw fail("You cannot edit an auction while a player is live", 409);
    }

    if (auction?.status === "COMPLETED") {
      throw fail("This auction is already completed", 409);
    }

    const assignedIds = validAuctioneers.map((u) => u._id);

    if (!auction) {
      auction = await Auction.create({
        organization: tournament.organization,
        tournament: tournament._id,
        auctionName: String(auctionName || `${tournament.name} Auction`).trim(),
        createdBy: req.user._id,
        assignedAuctioneers: assignedIds,
        scheduledAt: parsedSchedule,
        timerSeconds: seconds,
        minimumReservePerSlot: reserve,
      });
    } else {
      auction.auctionName = String(
        auctionName || auction.auctionName || `${tournament.name} Auction`,
      ).trim();

      auction.assignedAuctioneers = assignedIds;
      auction.scheduledAt = parsedSchedule;
      auction.timerSeconds = seconds;
      auction.minimumReservePerSlot = reserve;

      await auction.save();
    }

    tournament.auctioneers = assignedIds;
    tournament.auctionStatus = parsedSchedule ? "scheduled" : "pending";

    await tournament.save();

    const populated = await Auction.findById(auction._id)
      .populate("tournament", "name season")
      .populate("assignedAuctioneers", "name email")
      .populate("createdBy", "name");

    res.status(isCreating ? 201 : 200).json({
      message: "Auction configuration saved",
      auction: populated,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/auction-management/:auctionId
export async function getAuctionManagementDetail(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.auctionId)) {
      throw fail("Invalid auction ID", 400);
    }

    const auction = await Auction.findById(req.params.auctionId)
      .populate(
        "tournament",
        "name season organization status auctionStatus auctioneers",
      )
      .populate("assignedAuctioneers", "name email")
      .populate("createdBy", "name");

    if (!auction) {
      throw fail("Auction not found", 404);
    }

    if (!canViewTournament(req.user, auction.tournament)) {
      throw fail("You cannot access this auction", 403);
    }

    res.json({ auction });
  } catch (error) {
    next(error);
  }
}
