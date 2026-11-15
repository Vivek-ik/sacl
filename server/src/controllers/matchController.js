import Match from "../models/Match.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import Player from "../models/Player.js";
import Innings from "../models/Innings.js";
import {
  startInnings,
  setPlayers,
  addDelivery,
  undoLast,
  endInnings,
  snapshot,
} from "../services/scoringService.js";

const run = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, status, message) =>
  res.status(status).json({ success: false, message });
const io = (req) => req.app.get("io");

export const requireAssignedScorer = run(async (req, res, next) => {
  const match = await Match.findById(req.params.matchId).select("scorer");
  if (!match) return bad(res, 404, "Match not found");
  if (req.user.role !== "admin" && String(match.scorer) !== String(req.user.id))
    return bad(res, 403, "This match is not assigned to you");
  next();
});

export const createMatch = run(async (req, res) => {
  const {
    title,
    teamA,
    teamB,
    oversPerInnings,
    scorer,
    teamAPlayers = [],
    teamBPlayers = [],
  } = req.body;
  if (
    !title ||
    !teamA ||
    !teamB ||
    !scorer ||
    !Number.isInteger(Number(oversPerInnings)) ||
    Number(oversPerInnings) < 1 ||
    Number(oversPerInnings) > 50
  )
    return bad(
      res,
      400,
      "Title, teams, scorer and custom overs (1–50) are required",
    );
  if (String(teamA) === String(teamB))
    return bad(res, 400, "Choose two different teams");
  const [a, b, s] = await Promise.all([
    Team.findById(teamA),
    Team.findById(teamB),
    User.findById(scorer),
  ]);
  if (!a || !b) return bad(res, 404, "Team not found");
  if (!s || s.role !== "scorer")
    return bad(res, 400, "Choose a user with scorer role");
  const ids = [...teamAPlayers, ...teamBPlayers];
  if (new Set(ids.map(String)).size !== ids.length)
    return bad(res, 400, "A player cannot be in both match rosters");
  if (
    ids.length &&
    (await Player.countDocuments({ _id: { $in: ids } })) !== ids.length
  )
    return bad(res, 400, "Invalid player in roster");
  const match = await Match.create({
    title: req.body.title,
    teamA: req.body.teamA,
    teamB: req.body.teamB,
    scorer: s._id,
    oversPerInnings: req.body.oversPerInnings,
    teamAPlayers: req.body.teamAPlayers,
    teamBPlayers: req.body.teamBPlayers,

    createdBy: req.user.id,

    status: "scheduled",
  });
  res.status(201).json({ success: true, match });
});

export const listMatches = run(async (req, res) => {
  const filter = req.user.role === "scorer" ? { scorer: req.user.id } : {};
  const matches = await Match.find(filter)
    .populate("teamA", "name")
    .populate("teamB", "name")
    .populate("scorer", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, matches });
});
export const getMatch = run(async (req, res) => {
  const match = await Match.findById(req.params.matchId)
    .populate("teamA", "name")
    .populate("teamB", "name")
    .populate("teamAPlayers", "fullName category role")
    .populate("teamBPlayers", "fullName category role");
  if (!match) return bad(res, 404, "Match not found");
  res.json({ success: true, match });
});
export const roster = run(async (req, res) => {
  const m = await Match.findById(req.params.matchId)
    .populate("teamA", "name")
    .populate("teamB", "name")
    .populate("teamAPlayers", "fullName category role")
    .populate("teamBPlayers", "fullName category role");
  if (!m) return bad(res, 404, "Match not found");
  res.json({
    success: true,
    teams: [
      { team: m.teamA, players: m.teamAPlayers },
      { team: m.teamB, players: m.teamBPlayers },
    ],
  });
});

export const start = run(async (req, res) => {
  const matchId = req.params.matchId;

  const innings = await startInnings({
    matchId,
    ...req.body,
    createdBy: req.user.id,
  });

  const data = await snapshot(matchId);

  console.log("Emitting score update to:", `match:${matchId}`);

  io(req)?.to(`match:${matchId}`).emit("score:update", data);

  res.status(201).json({
    success: true,
    innings,
    snapshot: data,
  });
});

export const players = run(async (req, res) => {
  const innings = await setPlayers({
    matchId: req.params.matchId,
    inningsId: req.params.inningsId,
    ...req.body,
  });
  const data = await snapshot(req.params.matchId);
  io(req)?.to(`match:${req.params.matchId}`).emit("score:update", data);
  res.json({ success: true, innings, snapshot: data });
});
export const delivery = run(async (req, res) => {
  const result = await addDelivery({
    matchId: req.params.matchId,
    inningsId: req.params.inningsId,
    payload: req.body,
    userId: req.user.id,
  });
  const data = await snapshot(req.params.matchId);
  io(req)?.to(`match:${req.params.matchId}`).emit("score:update", data);
  res.status(201).json({ success: true, ...result, snapshot: data });
});
export const undo = run(async (req, res) => {
  const innings = await undoLast({
    matchId: req.params.matchId,
    inningsId: req.params.inningsId,
  });
  const data = await snapshot(req.params.matchId);
  io(req)?.to(`match:${req.params.matchId}`).emit("score:update", data);
  res.json({ success: true, innings, snapshot: data });
});
export const end = run(async (req, res) => {
  const innings = await endInnings({
    matchId: req.params.matchId,
    inningsId: req.params.inningsId,
  });
  const data = await snapshot(req.params.matchId);
  io(req)?.to(`match:${req.params.matchId}`).emit("score:update", data);
  res.json({ success: true, innings, snapshot: data });
});
export const complete = run(async (req, res) => {
  const m = await Match.findByIdAndUpdate(
    req.params.matchId,
    {
      status: "completed",
      result: String(req.body.result || "").slice(0, 300),
      winner: req.body.winner || null,
      completedAt: new Date(),
    },
    { new: true },
  );
  if (!m) return bad(res, 404, "Match not found");
  const data = await snapshot(m._id);
  io(req)?.to(`match:${m._id}`).emit("score:update", data);
  res.json({ success: true, match: m, snapshot: data });
});
export const publicSnapshot = run(async (req, res) => {
  const data = await snapshot(req.params.matchId);
  if (!data) return bad(res, 404, "Match not found");
  res.json({ success: true, ...data });
});
export const publicList = run(async (req, res) => {
  const matches = await Match.find({
    status: { $in: ["live", "scheduled", "completed"] },
  })
    .populate("teamA", "name")
    .populate("teamB", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, matches });
});
