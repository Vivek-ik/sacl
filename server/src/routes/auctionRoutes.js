import { Router } from "express";
import { protect, allowRoles } from "../middleware/auth.js";
import { getAuctionSnapshot } from "../services/auctionService.js";
const router = Router();
router.get("/state", protect, async (req, res, next) => {
  try { res.json(await getAuctionSnapshot()); } catch (e) { next(e); }
});
export default router;
