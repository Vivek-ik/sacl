
import { Router } from "express";
import {
  getPublicTournaments,
  getPublicTournamentById,
} from "../controllers/publicTournamentController.js";

const router = Router();

router.get("/", getPublicTournaments);
router.get("/:id", getPublicTournamentById);

export default router;
