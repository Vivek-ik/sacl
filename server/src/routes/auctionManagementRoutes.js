import { Router } from "express";
import { protect } from "../middleware/auth.js";

import {
  listAuctionManagement,
  getAuctionSetupOptions,
  createOrUpdateAuction,
  getAuctionManagementDetail,
} from "../controllers/auctionManagementController.js";

const router = Router();

router.use(protect);

router.get("/", listAuctionManagement);

router.get("/setup-options", getAuctionSetupOptions);

router.post("/", createOrUpdateAuction);

router.get("/:auctionId", getAuctionManagementDetail);

export default router;
