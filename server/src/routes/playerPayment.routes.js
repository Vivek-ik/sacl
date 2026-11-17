import express from "express";
import {
  submitPaymentProof,
  getMyPaymentStatus,
} from "../controllers/playerPayment.controller.js";
import paymentUpload from "../middleware/paymentUpload.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post(
  "/submit-proof",
  paymentUpload.single("screenshot"),
  submitPaymentProof,
);

router.get("/my-status", getMyPaymentStatus);

export default router;
