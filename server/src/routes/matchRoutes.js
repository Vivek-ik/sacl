import { Router } from "express";

import { protect, allowRoles } from "../middleware/auth.js";
import { requireOrganization } from "../middleware/requireOrganization.js";

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

// All routes require authentication and organization context.
r.use(protect);
r.use(requireOrganization);

// Organization admins and existing legacy admins
const admin = allowRoles("org_admin", "admin");

// Scorers and admins
const scorer = allowRoles("org_admin", "admin", "scorer");

r.get("/", scorer, listMatches);

r.post("/", admin, createMatch);

r.post("/:matchId/complete", admin, complete);

r.get("/:matchId", getMatch);

r.get("/:matchId/roster", scorer, requireAssignedScorer, roster);

r.post("/:matchId/innings/start", scorer, requireAssignedScorer, start);

r.patch(
  "/:matchId/innings/:inningsId/players",
  scorer,
  requireAssignedScorer,
  players,
);

r.post(
  "/:matchId/innings/:inningsId/deliveries",
  scorer,
  requireAssignedScorer,
  delivery,
);

r.post(
  "/:matchId/innings/:inningsId/undo",
  scorer,
  requireAssignedScorer,
  undo,
);

r.post("/:matchId/innings/:inningsId/end", scorer, requireAssignedScorer, end);

export default r;
