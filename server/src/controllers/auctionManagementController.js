import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import User from "../models/User.js";

const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);

const MANAGER_ROLES = ["super_admin", "org_admin", "admin"];

const AUCTION_FORMATS = ["LIVE_BIDDING", "SNAKE_DRAFT", "DIRECT_SELECTION"];

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
  if (!tournament) return false;

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

    const tournamentIds = tournaments.map((tournament) => tournament._id);

    const auctions = await Auction.find({
      tournament: { $in: tournamentIds },
    })
      // IMPORTANT: Include auctionFormat and selectionPrice.
      .select(
        [
          "organization",
          "tournament",
          "auctionName",
          "auctionFormat",
          "selectionPrice",
          "status",
          "createdBy",
          "assignedAuctioneers",
          "scheduledAt",
          "timerSeconds",
          "minimumReservePerSlot",
          "createdAt",
          "updatedAt",
        ].join(" "),
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

    return res.json({
      success: true,
      auctions: rows,
    });
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

    return res.json({
      success: true,
      tournaments,
      auctioneers,
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/auction-management
export async function createOrUpdateAuction(req, res, next) {
  try {
    if (!isOrgManager(req.user.role)) {
      throw fail("Only organization admins can configure auctions", 403);
    }

    const {
      tournamentId,
      auctionName,
      auctioneerIds = [],
      scheduledAt = null,
      timerSeconds = 45,
      minimumReservePerSlot = 0,
      auctionFormat,
      selectionPrice = 500,
    } = req.body;

    console.log("auctionFormat", auctionFormat);
    
    // Validate tournament and organization access.
    const tournament = await getTournamentForManager(req.user, tournamentId);

    // Validate auction format.
    if (!AUCTION_FORMATS.includes(auctionFormat)) {
      throw fail(
        "Invalid auction format. Allowed formats: LIVE_BIDDING, SNAKE_DRAFT, DIRECT_SELECTION",
      );
    }

    // Validate auctioneer IDs.
    if (!Array.isArray(auctioneerIds)) {
      throw fail("auctioneerIds must be an array");
    }

    const cleanIds = [...new Set(auctioneerIds.map((id) => String(id).trim()))];

    if (cleanIds.some((id) => !mongoose.isValidObjectId(id))) {
      throw fail("One or more auctioneer IDs are invalid");
    }

    // Validate assigned auctioneers.
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

    const assignedIds = validAuctioneers.map((user) => user._id);

    // Validate timer.
    const seconds = Number(timerSeconds);

    if (!Number.isInteger(seconds) || seconds < 5 || seconds > 300) {
      throw fail("Timer must be between 5 and 300 seconds");
    }

    // Validate minimum reserve.
    const reserve = Number(minimumReservePerSlot);

    if (!Number.isSafeInteger(reserve) || reserve < 0) {
      throw fail("Minimum reserve must be a valid non-negative whole number");
    }

    // Validate fixed selection price.
    const fixedPrice = Number(selectionPrice);

    if (!Number.isSafeInteger(fixedPrice) || fixedPrice < 0) {
      throw fail("Selection price must be a valid non-negative whole number");
    }

    // Validate auction name.
    const name = String(auctionName || `${tournament.name} Auction`).trim();

    if (!name) {
      throw fail("Auction name is required");
    }

    // Validate schedule.
    const parsedSchedule = scheduledAt ? new Date(scheduledAt) : null;

    if (parsedSchedule && Number.isNaN(parsedSchedule.getTime())) {
      throw fail("Invalid scheduled date");
    }

    if (parsedSchedule && parsedSchedule.getTime() < Date.now()) {
      throw fail("Scheduled date cannot be in the past");
    }

    // Find existing auction for this tournament.
    let auction = await Auction.findOne({
      organization: tournament.organization,
      tournament: tournament._id,
    });

    const isCreating = !auction;

    // Prevent editing an active or completed auction.
    if (auction?.status === "RUNNING") {
      throw fail("You cannot edit an auction while a player is live", 409);
    }

    if (auction?.status === "COMPLETED") {
      throw fail("This auction is already completed", 409);
    }

    if (!auction) {
      auction = new Auction({
        organization: tournament.organization,
        tournament: tournament._id,
        createdBy: req.user._id,
      });
    }

    // Save auction configuration.
    auction.auctionName = name;
    auction.auctionFormat = auctionFormat;
    auction.selectionPrice = fixedPrice;
    auction.assignedAuctioneers = assignedIds;
    auction.scheduledAt = parsedSchedule;
    auction.timerSeconds = seconds;
    auction.minimumReservePerSlot = reserve;

    await auction.save();

    // Synchronize tournament auctioneers.
    tournament.auctioneers = assignedIds;
    tournament.auctionStatus = parsedSchedule ? "scheduled" : "pending";

    await tournament.save();

    // Fetch freshly saved auction with populated fields.
    const populatedAuction = await Auction.findById(auction._id)
      .populate("tournament", "name season")
      .populate("assignedAuctioneers", "name email phone")
      .populate("createdBy", "name email")
      .lean();

    return res.status(isCreating ? 201 : 200).json({
      success: true,
      message: isCreating
        ? "Auction created successfully"
        : "Auction updated successfully",
      auction: populatedAuction,
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
      .populate("assignedAuctioneers", "name email phone")
      .populate("createdBy", "name email");

    if (!auction) {
      throw fail("Auction not found", 404);
    }

    if (!canViewTournament(req.user, auction.tournament)) {
      throw fail("You cannot access this auction", 403);
    }

    return res.json({
      success: true,
      auction,
    });
  } catch (error) {
    next(error);
  }
}
