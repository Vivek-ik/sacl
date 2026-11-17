import { Router } from "express";
import crypto from "crypto";

import Payment from "../models/Payment.js";
import { protect } from "../middleware/auth.js";

import {
  createPhonePeOrder,
  checkPhonePeOrderStatus,
} from "../services/phonepe.service.js";

const router = Router();

router.use(protect);

// POST /api/payments/registration/create
router.post("/registration/create", async (req, res) => {
  try {
    const { kind } = req.body;

    if (kind !== "player") {
      return res.status(400).json({
        success: false,
        message: "Invalid registration payment type",
      });
    }

    // Amount is controlled by backend, never by frontend.
    const amountInRupees = Number(process.env.PLAYER_REGISTRATION_AMOUNT);

    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      return res.status(500).json({
        success: false,
        message: "Player registration amount is not configured",
      });
    }

    const amount = Math.round(amountInRupees * 100);

    // Generate a unique merchant order ID.
    const merchantOrderId = `WK_${Date.now()}_${crypto
      .randomBytes(4)
      .toString("hex")}`;

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured");
    }

    const redirectUrl = new URL("/payment/phonepe/return", frontendUrl);

    redirectUrl.searchParams.set("merchantOrderId", merchantOrderId);

    // Create pending payment in our database first.
    const payment = await Payment.create({
      user: req.user._id,
      kind: "player",
      merchantOrderId,
      amount,
      status: "PENDING",
    });

    try {
      const phonePeOrder = await createPhonePeOrder({
        merchantOrderId,
        amount,
        redirectUrl: redirectUrl.toString(),
        userId: req.user._id,
      });

      payment.phonePeOrderId = phonePeOrder.orderId;
      payment.redirectUrl = phonePeOrder.redirectUrl;
      await payment.save();

      return res.status(201).json({
        success: true,
        merchantOrderId,
        redirectUrl: phonePeOrder.redirectUrl,
      });
    } catch (error) {
      payment.status = "FAILED";
      await payment.save();
      throw error;
    }
  } catch (error) {
    console.error("Create registration payment:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment creation failed",
    });
  }
});

// GET /api/payments/registration/status/:merchantOrderId
router.get("/registration/status/:merchantOrderId", async (req, res) => {
  try {
    const payment = await Payment.findOne({
      merchantOrderId: req.params.merchantOrderId,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Already verified successfully.
    if (payment.status === "COMPLETED") {
      return res.json({
        success: true,
        status: payment.status,
      });
    }

    const phonePeStatus = await checkPhonePeOrderStatus(
      payment.merchantOrderId,
    );

    // Only trust PhonePe's server-side status response.
    if (
      phonePeStatus.state === "COMPLETED" &&
      Number(phonePeStatus.amount) === payment.amount
    ) {
      const latestAttempt = phonePeStatus.paymentDetails?.find(
        (item) => item.state === "COMPLETED",
      );

      payment.status = "COMPLETED";
      payment.transactionId = latestAttempt?.transactionId || null;
      payment.paymentMode = latestAttempt?.paymentMode || null;
      payment.paidAt = new Date();
    } else if (phonePeStatus.state === "FAILED") {
      payment.status = "FAILED";
    }

    payment.rawStatusResponse = phonePeStatus;
    await payment.save();

    return res.json({
      success: true,
      status: payment.status,
      transactionId: payment.transactionId,
    });
  } catch (error) {
    console.error("Verify registration payment:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
});

export default router;
