import { Router } from "express";
import { protect, allowRoles } from "../middleware/auth.js";
import { getAuctionSnapshot } from "../services/auctionService.js";
import Auction from "../models/Auction.js";
import Player from "../models/Player.js";
import mongoose from "mongoose";

const router = Router();

router.get("/state", protect, async (req, res, next) => {
  try {
    res.json(await getAuctionSnapshot());
  } catch (e) {
    next(e);
  }
});

async function getAccessibleAuction(auctionId, user) {
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw Object.assign(new Error("Auction not found"), { status: 404 });
  }

  const role = user.role;
  let allowed = false;

  if (role === "super_admin") {
    allowed = true;
  } else if (["org_admin", "admin"].includes(role)) {
    allowed = String(user.organization) === String(auction.organization);
  } else if (role === "auctioneer") {
    allowed = auction.assignedAuctioneers.some(
      (id) => String(id) === String(user._id),
    );
  } else if (role === "team_owner") {
    const Team = (await import("../models/Team.js")).default;

    allowed = Boolean(
      await Team.exists({
        tournament: auction.tournament,
        primaryOwner: user._id,
        approvalStatus: "approved",
      }),
    );
  }

  if (!allowed) {
    throw Object.assign(new Error("You cannot access this auction"), {
      status: 403,
    });
  }

  return auction;
}


// Public read-only state for one specific auction.
// GET /api/auction/public/:auctionId/state
router.get("/public/:auctionId/state", async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    if (!mongoose.isValidObjectId(auctionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid auction ID.",
      });
    }

    const auction = await getAuctionSnapshot(auctionId);

    res.set("Cache-Control", "no-store");
    return res.json({
      success: true,
      auction,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:auctionId/state", protect, async (req, res, next) => {
  try {
    const auction = await getAccessibleAuction(req.params.auctionId, req.user);

    await auction.populate([
      { path: "currentPlayer" },
      { path: "highestBidTeam", select: "name purseRemaining" },
      { path: "bids.team", select: "name" },
    ]);

    res.json({ auction });
  } catch (error) {
    next(error);
  }
});

router.get("/:auctionId/players", protect, async (req, res, next) => {
  try {
    const auction = await getAccessibleAuction(req.params.auctionId, req.user);

    const players = await Player.find({
      tournament: auction.tournament,
      approvalStatus: "approved",
      auctionStatus: "AVAILABLE",
    })
      .select(
        "fullName category role photo age battingStyle bowlingStyle approvalStatus auctionStatus",
      )
      .sort({ category: 1, fullName: 1 })
      .lean();

    res.json({ players });
  } catch (error) {
    next(error);
  }
});

export default router;
