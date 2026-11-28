import { Router } from "express";
import { protect } from "../middleware/auth.js";
import Auction from "../models/Auction.js";

import {
  initializeSnakeDraft,
  makeSnakeDraftPick,
  getDraftSnapshot,
  getDirectSelectionSnapshot,
  submitDirectBids,
  closeDirectSubmissions,
  awardDirectPlayer,
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

async function requireManager(req, res, next) {
  try {
    const auction = await Auction.findById(req.params.auctionId);

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: "Auction not found.",
      });
    }

    if (!canManageAuction(req.user, auction)) {
      return res.status(403).json({
        success: false,
        message:
          "Only an organization admin or assigned auctioneer can do this.",
      });
    }

    req.auction = auction;
    return next();
  } catch (error) {
    return next(error);
  }
}

// Initialize Snake Draft.
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

      return res.json({
        success: true,
        message: "Snake Draft initialized successfully.",
        ...result,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// Get Snake Draft state.
router.get("/:auctionId/draft", protect, async (req, res, next) => {
  try {
    const result = await getDraftSnapshot(req.params.auctionId);
    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

// Make Snake Draft pick.
router.post("/:auctionId/draft/pick", protect, async (req, res, next) => {
  try {
    const { teamId, playerId } = req.body;

    const result = await makeSnakeDraftPick({
      auctionId: req.params.auctionId,
      teamId,
      playerId,
      userId: getUserId(req.user),
    });

    req.app
      .get("io")
      ?.to(`auction:${req.params.auctionId}`)
      .emit("draft:pick-updated", {
        auctionId: req.params.auctionId,
        teamId,
        playerId,
      });

    return res.json({
      success: true,
      message: "Player picked successfully.",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
});

// Get Direct Selection state.
router.get("/:auctionId/direct", protect, async (req, res, next) => {
  try {
    const result = await getDirectSelectionSnapshot(
      req.params.auctionId,
      req.user,
    );

    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
});

// Submit sealed bids.
router.post("/:auctionId/direct/submit", protect, async (req, res, next) => {
  try {
    const result = await submitDirectBids({
      auctionId: req.params.auctionId,
      teamId: req.body.teamId,
      bids: req.body.bids,
      userId: getUserId(req.user),
    });

    req.app
      .get("io")
      ?.to(`auction:${req.params.auctionId}`)
      .emit("direct-submission:updated", {
        auctionId: req.params.auctionId,
        teamId: req.body.teamId,
      });

    return res.json({
      success: true,
      message: "Sealed bids submitted successfully.",
      ...result,
    });
  } catch (error) {
    return next(error);
  }
});

// Close submissions.
router.post(
  "/:auctionId/direct/close",
  protect,
  requireManager,
  async (req, res, next) => {
    try {
      const result = await closeDirectSubmissions(
        req.params.auctionId,
        getUserId(req.user),
      );

      req.app
        .get("io")
        ?.to(`auction:${req.params.auctionId}`)
        .emit("direct-submissions:closed", {
          auctionId: req.params.auctionId,
        });

      return res.json({
        success: true,
        message: "Submissions have been closed.",
        ...result,
      });
    } catch (error) {
      return next(error);
    }
  },
);

// Award player.
router.post(
  "/:auctionId/direct/award",
  protect,
  requireManager,
  async (req, res, next) => {
    try {
      const result = await awardDirectPlayer({
        auctionId: req.params.auctionId,
        playerId: req.body.playerId,
        teamId: req.body.teamId,
        remarks: req.body.remarks,
        userId: getUserId(req.user),
      });

      req.app
        .get("io")
        ?.to(`auction:${req.params.auctionId}`)
        .emit("direct-award:updated", {
          auctionId: req.params.auctionId,
          playerId: req.body.playerId,
          teamId: req.body.teamId,
        });

      return res.json({
        success: true,
        message: "Player awarded successfully.",
        ...result,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
