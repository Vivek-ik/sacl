import mongoose from "mongoose";
import Player from "../models/Player.js";

// GET ALL PAYMENT PROOFS WAITING FOR REVIEW
export const getPendingPaymentProofs = async (req, res, next) => {
  try {
    const players = await Player.find({
      paymentVerificationStatus: "submitted",
    })
      .populate("user", "name email phone")
      .populate("tournament", "name season")
      .sort({ paymentSubmittedAt: 1 })
      .lean();

    return res.json({
      success: true,
      players,
      count: players.length,
    });
  } catch (error) {
    next(error);
  }
};

// ADMIN APPROVES OR REJECTS PAYMENT
export const reviewPaymentProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    console.log("status", status);

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid player ID.",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Action must be approved or rejected.",
      });
    }

    const player = await Player.findById(id);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found.",
      });
    }

    if (player.paymentVerificationStatus !== "submitted") {
      return res.status(409).json({
        success: false,
        message: "This payment is not awaiting review.",
      });
    }

    if (status === "approved") {
      player.paymentVerificationStatus = "approved";
      player.registrationFeeStatus = "paid";
      player.paymentRejectionReason = "";
    } else {
      if (!reason?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Please provide a rejection reason.",
        });
      }

      player.paymentVerificationStatus = "rejected";
      player.registrationFeeStatus = "pending";
      player.paymentRejectionReason = reason.trim();
    }

    player.paymentReviewedBy = req.user._id;
    player.paymentReviewedAt = new Date();

    await player.save();

    return res.json({
      success: true,
      message:
        status === "approved"
          ? "Payment verified successfully."
          : "Payment proof rejected.",
      player,
    });
  } catch (error) {
    next(error);
  }
};
