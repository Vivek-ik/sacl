import express from "express";
import {
  createTournament,
  getTournaments,
  getTournamentById,
  approveTournament,
  rejectTournament,
  updateTournament,
  deleteTournament,
} from "../controllers/tournamentController.js";
import { protect, allowRoles } from "../middleware/auth.js";
import { requireOrganization } from "../middleware/requireOrganization.js";

const router = express.Router();

router.use(protect);
router.use(requireOrganization);
router.use(allowRoles("org_admin", "admin"));

router.get("/", getTournaments);
router.get("/:id", getTournamentById);
router.post("/", createTournament);

router.patch("/:id", updateTournament);
router.delete("/:id", protect, deleteTournament);

router.patch("/:id/approved", approveTournament);
router.patch("/:id/rejected", rejectTournament);

export default router;
