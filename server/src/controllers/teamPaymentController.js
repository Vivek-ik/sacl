import Team from "../models/Team.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

export const submitTeamPaymentProof = async (req, res, next) => {
  try {
    const { utr } = req.body;
    const cleanUtr = utr?.trim();

    if (!cleanUtr) {
      return res.status(400).json({
        success: false,
        message: "Please enter your UTR number.",
      });
    }

    if (!/^[a-zA-Z0-9]{8,30}$/.test(cleanUtr)) {
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

    // Find the team owned by the logged-in user.
    const team = await Team.findOne({
      primaryOwner: req.user._id,
    }).sort({ createdAt: -1 });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team registration not found.",
      });
    }

    if (team.registrationFeeStatus === "paid") {
      return res.status(409).json({
        success: false,
        message: "Your team payment has already been verified.",
      });
    }

    if (team.paymentVerificationStatus === "submitted") {
      return res.status(409).json({
        success: false,
        message: "Your team payment proof is already under review.",
      });
    }

    const existingUtr = await Team.findOne({
      paymentUtr: cleanUtr,
      _id: { $ne: team._id },
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

    team.paymentScreenshot = uploaded.url;
    team.paymentScreenshotPublicId = uploaded.publicId;
    team.paymentUtr = cleanUtr;
    team.paymentSubmittedAt = new Date();
    team.paymentVerificationStatus = "submitted";
    team.paymentRejectionReason = "";
    team.paymentReviewedBy = null;
    team.paymentReviewedAt = null;

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Team payment proof submitted. Awaiting admin verification.",
      team,
    });
  } catch (error) {
    next(error);
  }
};
