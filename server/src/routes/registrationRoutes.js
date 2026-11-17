import { Router } from "express";
import {
  registerPlayer,
  registerTeam,
  myRegistration,
  myTeamApplications,
} from "../controllers/registrationController.js";
import { protect, allowRoles } from "../middleware/auth.js";
import Team from "../models/Team.js";
const router = Router();

router.get("/available-teams", async (req, res, next) => {
  try {
    const teams = await Team.find({
      approvalStatus: "approved",
    })
      .select("_id name")
      .sort({ name: 1 });

    res.json({
      success: true,
      teams,
    });
  } catch (error) {
    next(error);
  }
});

router.use(protect);
router.get("/me", myRegistration);
router.get("/my-applications", allowRoles("team_owner"), myTeamApplications);
router.post("/player", allowRoles("player"), registerPlayer);
router.post("/team", allowRoles("team_owner"), registerTeam);
export default router;
