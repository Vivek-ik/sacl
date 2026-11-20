import express from "express";
import { submitTeamPaymentProof } from "../controllers/teamPaymentController.js";
import { protect } from "../middleware/auth.js";
import paymentUpload from "../middleware/paymentUpload.js";

const router = express.Router();

router.post(
  "/submit-proof",
  protect,
  paymentUpload.single("screenshot"),
  submitTeamPaymentProof,
);

export default router;
