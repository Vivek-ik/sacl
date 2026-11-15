import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  createMatch,
  listMatches,
  getMatch,
  roster,
  start,
  players,
  delivery,
  undo,
  end,
  complete,
  requireAssignedScorer,
} from "../controllers/matchController.js";
const r = Router();
const roles =
  (...allowed) =>
  (req, res, next) =>
    allowed.includes(req.user?.role)
      ? next()
      : res.status(403).json({ success: false, message: "Not authorized" });
const admin = [protect, roles("admin")],
  scorer = [protect, roles("admin", "scorer")];
r.get("/", protect, roles("admin", "scorer"), listMatches);
r.post("/", ...admin, createMatch);
r.post("/:matchId/complete", ...admin, complete);
r.get("/:matchId", protect, getMatch);
r.get("/:matchId/roster", ...scorer, requireAssignedScorer, roster);
r.post("/:matchId/innings/start", ...scorer, requireAssignedScorer, start);
r.patch(
  "/:matchId/innings/:inningsId/players",
  ...scorer,
  requireAssignedScorer,
  players,
);
r.post(
  "/:matchId/innings/:inningsId/deliveries",
  ...scorer,
  requireAssignedScorer,
  delivery,
);
r.post(
  "/:matchId/innings/:inningsId/undo",
  ...scorer,
  requireAssignedScorer,
  undo,
);
r.post(
  "/:matchId/innings/:inningsId/end",
  ...scorer,
  requireAssignedScorer,
  end,
);
export default r;
