import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  initializeSnakeDraft,
  makeSnakeDraftPick,
  makeDirectSelection,
  getDraftSnapshot,
  getDirectSelectionSnapshot,
} from "../services/auctionFormatService.js";

const router = Router();

function getUserId(user) {
  return user?._id || user?.id;
}

function canManageAuction(user, auction) {
  if (!user || !auction) return false;

  if (user.role === "super_admin") return true;

  if (["admin", "org_admin"].includes(user.role)) {
    return String(user.organization) === String(auction.organization);
  }

  return (auction.assignedAuctioneers || []).some(
    (id) => String(id?._id || id) === String(getUserId(user)),
  );
}

import Auction from "../models/Auction.js";

async function requireManager(req, res, next) {
  try {
    const auction = await Auction.findById(req.params.auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found." });
    }

    if (!canManageAuction(req.user, auction)) {
      return res.status(403).json({
        message:
          "Only an organization admin or assigned auctioneer can do this.",
      });
    }

    req.auction = auction;
    next();
  } catch (error) {
    next(error);
  }
}

// Admin/auctioneer initializes the draft order.
router.post(
  "/:auctionId/draft/initialize",
  protect,
  requireManager,
  async (req, res, next) => {
    try {
      const result = await initializeSnakeDraft(
        req.params.auctionId,
        getUserId(req.user),
      );

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
);

// Current draft state.
router.get("/:auctionId/draft", protect, async (req, res, next) => {
  try {
    const result = await getDraftSnapshot(req.params.auctionId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// Team owner makes a Snake Draft pick.
router.post("/:auctionId/draft/pick", protect, async (req, res, next) => {
  try {
    const { teamId, playerId } = req.body;

    const result = await makeSnakeDraftPick({
      auctionId: req.params.auctionId,
      teamId,
      playerId,
      userId: getUserId(req.user),
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// Team owner makes a Direct Selection.
router.post("/:auctionId/direct/select", protect, async (req, res, next) => {
  try {
    const { teamId, playerId } = req.body;
    const { auctionId } = req.params;

    // Save selection in database first.
    const result = await makeDirectSelection({
      auctionId,
      teamId,
      playerId,
      userId: getUserId(req.user),
    });

    // Broadcast only after successful database update.
    const io = req.app.get("io");

    io?.to(`auction:${String(auctionId)}`).emit("direct-selection:updated", {
      auctionId,
      playerId,
      teamId,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});
// Direct Selection state.
router.get("/:auctionId/direct", protect, async (req, res, next) => {
  try {
    const result = await getDirectSelectionSnapshot(req.params.auctionId);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
