import Player from "../models/Player.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

// Upload image buffer to Cloudinary
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "sacl/payment-proofs",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });

// PLAYER SUBMITS UTR + SCREENSHOT
export const submitPaymentProof = async (req, res, next) => {
  try {
    const { utr } = req.body;

    if (!utr?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your UTR number.",
      });
    }

    if (!/^[a-zA-Z0-9]{8,30}$/.test(utr.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid UTR/reference number.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload your payment screenshot.",
      });
    }

    const player = await Player.findOne({
      user: req.user._id,
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player registration not found.",
      });
    }

    if (player.registrationFeeStatus === "paid") {
      return res.status(409).json({
        success: false,
        message: "Your payment has already been verified.",
      });
    }

    if (player.paymentVerificationStatus === "submitted") {
      return res.status(409).json({
        success: false,
        message: "Your payment proof is already under review.",
      });
    }

    // Prevent reuse of another player's UTR.
    const existingUtr = await Player.findOne({
      paymentUtr: utr.trim(),
      _id: { $ne: player._id },
    });

    if (existingUtr) {
      return res.status(409).json({
        success: false,
        message: "This UTR has already been submitted.",
      });
    }

    const uploaded = await uploadBufferToCloudinary(
      req.file.buffer,
      "sacl/payment-proofs",
    );

    player.paymentScreenshot = uploaded.url;
    player.paymentScreenshotPublicId = uploaded.publicId;
    player.paymentUtr = utr.trim();
    player.paymentSubmittedAt = new Date();
    player.paymentVerificationStatus = "submitted";
    player.paymentRejectionReason = "";
    player.paymentReviewedBy = null;
    player.paymentReviewedAt = null;

    await player.save();

    return res.status(200).json({
      success: true,
      message: "Payment proof submitted. It is awaiting admin verification.",
      player,
    });
  } catch (error) {
    next(error);
  }
};

// PLAYER CHECKS THEIR PAYMENT STATUS
export const getMyPaymentStatus = async (req, res, next) => {
  try {
    const player = await Player.findOne({
      user: req.user._id,
    }).select(
      "registrationFeeStatus paymentVerificationStatus paymentUtr paymentScreenshot paymentSubmittedAt paymentRejectionReason approvalStatus",
    );

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player registration not found.",
      });
    }

    return res.json({
      success: true,
      payment: player,
    });
  } catch (error) {
    next(error);
  }
};
