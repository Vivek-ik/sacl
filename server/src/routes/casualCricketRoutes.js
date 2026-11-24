import { Router } from "express";
import { protect } from "../middleware/auth.js";

import {
  createCasualTeam,
  listCasualTeams,
  updateCasualTeam,
  deleteCasualTeam,
  createCasualMatch,
  listCasualMatches,
  getCasualMatch,
  startCasualMatch,
  scoreCasualBall,
  startSecondInnings,
  undoCasualBall,
  finishCasualInnings,
} from "../controllers/casualCricketController.js";

const router = Router();

router.use(protect);

// Saved teams
router.get("/teams", listCasualTeams);
router.post("/teams", createCasualTeam);
router.patch("/teams/:teamId", updateCasualTeam);
router.delete("/teams/:teamId", deleteCasualTeam);

// Friendly matches
router.get("/matches", listCasualMatches);
router.post("/matches", createCasualMatch);
router.get("/matches/:matchId", getCasualMatch);
router.post("/matches/:matchId/start", startCasualMatch);
router.post("/matches/:matchId/score", scoreCasualBall);
router.post("/matches/:matchId/next-innings", startSecondInnings);
router.post("/matches/:matchId/undo", undoCasualBall);
router.post("/matches/:matchId/finish-innings", finishCasualInnings);

export default router;
