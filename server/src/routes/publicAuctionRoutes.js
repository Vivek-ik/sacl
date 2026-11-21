import { Router } from "express";
import { getAuctionSnapshot } from "../services/auctionService.js";

const router = Router();

// Public read-only snapshot. No login is required to watch the auction.
router.get("/state", async (req, res, next) => {
  try {
    const state = await getAuctionSnapshot();
    res.set("Cache-Control", "no-store");
    res.json(state);
  } catch (error) {
    next(error);
  }
});

export default router;
