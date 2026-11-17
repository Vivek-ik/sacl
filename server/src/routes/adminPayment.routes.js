import express from "express";
import {
  getPendingPaymentProofs,
  reviewPaymentProof,
} from "../controllers/adminPayment.controller.js";
import { protect, allowRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, allowRoles("admin", "org_admin", "super_admin"));

router.get("/pending", getPendingPaymentProofs);
router.patch("/:id/review", reviewPaymentProof);

export default router;
