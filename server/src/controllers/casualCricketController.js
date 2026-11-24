import mongoose from "mongoose";
import CasualTeam from "../models/CasualTeam.js";
import CasualMatch from "../models/CasualMatch.js";

const getUserId = (req) => req.user?.id || req.user?._id;

const getMatchForOwner = async (matchId, userId) => {
  if (!mongoose.isValidObjectId(matchId)) {
    throw new Error("Invalid match ID");
  }

  const match = await CasualMatch.findOne({
    _id: matchId,
    createdBy: userId,
  });

  if (!match) throw new Error("Match not found or access denied");
  return match;
};

const getCurrentInnings = (match) =>
  match.innings.find((item) => item.number === match.currentInnings);

const getTeam = (match, index) => (index === 0 ? match.teamA : match.teamB);

const sameId = (a, b) => String(a) === String(b);

const validPlayer = (team, playerId) =>
  team.players.find((p) => sameId(p.memberId, playerId));

const getBowlingTeam = (match, innings) =>
  getTeam(match, innings.battingTeamIndex === 0 ? 1 : 0);

const getBattingTeam = (match, innings) =>
  getTeam(match, innings.battingTeamIndex);

const oversText = (balls = 0) => `${Math.floor(balls / 6)}.${balls % 6}`;

const getBowlerWicketCredit = (dismissal) =>
  !["run_out", "retired_hurt", "obstructing_field"].includes(dismissal);

const makeStats = (players) => ({
  battingStats: players.map((p) => ({
    playerId: p.memberId,
    name: p.name,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    isOut: false,
    dismissal: "",
  })),
});

const makeBowlingStats = (players) =>
  players.map((p) => ({
    playerId: p.memberId,
    name: p.name,
    legalBalls: 0,
    runsConceded: 0,
    wickets: 0,
    wides: 0,
    noBalls: 0,
    maidens: 0,
  }));

const initializeInnings = (
  match,
  number,
  battingTeamIndex,
  strikerId,
  nonStrikerId,
  bowlerId,
) => {
  const battingTeam = getTeam(match, battingTeamIndex);
  const bowlingTeam = getTeam(match, battingTeamIndex === 0 ? 1 : 0);

  if (battingTeam.players.length < 2) {
    throw new Error("The batting team needs at least two saved players");
  }

  if (!validPlayer(battingTeam, strikerId)) {
    throw new Error("Select a valid opening striker");
  }

  if (!validPlayer(battingTeam, nonStrikerId)) {
    throw new Error("Select a valid non-striker");
  }

  if (sameId(strikerId, nonStrikerId)) {
    throw new Error("Striker and non-striker must be different players");
  }

  if (!validPlayer(bowlingTeam, bowlerId)) {
    throw new Error("Select a valid opening bowler");
  }

  const stats = makeStats(battingTeam.players);

  return {
    number,
    battingTeamIndex,
    openingStrikerId: strikerId,
    openingNonStrikerId: nonStrikerId,
    openingBowlerId: bowlerId,
    strikerId,
    nonStrikerId,
    bowlerId,
    battingStats: stats.battingStats,
    bowlingStats: makeBowlingStats(bowlingTeam.players),
    status: "in_progress",
  };
};

// Rebuild every statistic and player position from the recorded balls.
// This is also used by Undo.
const rebuildInnings = (match, innings) => {
  const battingTeam = getBattingTeam(match, innings);
  const bowlingTeam = getBowlingTeam(match, innings);

  const battingStats = makeStats(battingTeam.players).battingStats;
  const bowlingStats = makeBowlingStats(bowlingTeam.players);

  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;

  let strikerId = innings.openingStrikerId;
  let nonStrikerId = innings.openingNonStrikerId;
  let bowlerId = innings.openingBowlerId;

  const batter = (id) => battingStats.find((p) => sameId(p.playerId, id));

  const bowler = (id) => bowlingStats.find((p) => sameId(p.playerId, id));

  const overRuns = new Map();
  const overBalls = new Map();

  innings.events.forEach((event) => {
    const currentStriker = batter(event.strikerId);
    const currentBowler = bowler(event.bowlerId);

    runs += event.totalRuns || 0;

    if (event.legal) legalBalls += 1;
    if (event.wicket) wickets += 1;

    // Balls faced: wides do not count; no-balls do.
    if (currentStriker && event.extraType !== "wide") {
      currentStriker.balls += 1;
      currentStriker.runs += event.runs || 0;

      if (event.extraType === "none") {
        if (event.runs === 4) currentStriker.fours += 1;
        if (event.runs === 6) currentStriker.sixes += 1;
      }
    }

    if (currentBowler) {
      // Byes and leg-byes are not charged to the bowler.
      if (["none", "wide", "no_ball"].includes(event.extraType)) {
        currentBowler.runsConceded += event.totalRuns || 0;
      }

      if (event.extraType === "wide") currentBowler.wides += event.extraRuns;
      if (event.extraType === "no_ball")
        currentBowler.noBalls += event.extraRuns;

      if (event.legal) currentBowler.legalBalls += 1;

      if (event.wicket && getBowlerWicketCredit(event.dismissal)) {
        currentBowler.wickets += 1;
      }

      const legalBallsBeforeEvent = legalBalls - (event.legal ? 1 : 0);

      const overNumber = Math.floor(legalBallsBeforeEvent / 6);
      const key = `${event.bowlerId}:${overNumber}`;

      overRuns.set(
        key,
        (overRuns.get(key) || 0) +
          (["none", "wide", "no_ball"].includes(event.extraType)
            ? event.totalRuns
            : 0),
      );

      if (event.legal) {
        overBalls.set(key, (overBalls.get(key) || 0) + 1);
      }
    }

    if (event.wicket) {
      const dismissed = batter(event.dismissedPlayerId);
      if (dismissed) {
        dismissed.isOut = true;
        dismissed.dismissal = event.dismissal || "out";
      }
    }

    strikerId = event.strikerAfterId;
    nonStrikerId = event.nonStrikerAfterId;
    bowlerId = event.bowlerId;
  });

  // A maiden is a completed six-ball over with zero runs charged.
  for (const [key, balls] of overBalls.entries()) {
    if (balls === 6 && (overRuns.get(key) || 0) === 0) {
      const id = key.split(":")[0];
      const stat = bowler(id);
      if (stat) stat.maidens += 1;
    }
  }

  innings.runs = runs;
  innings.wickets = wickets;
  innings.legalBalls = legalBalls;
  innings.battingStats = battingStats;
  innings.bowlingStats = bowlingStats;
  innings.strikerId = strikerId;
  innings.nonStrikerId = nonStrikerId;
  innings.bowlerId = bowlerId;

  if (
    innings.legalBalls >= match.oversPerInnings * 6 ||
    innings.wickets >= battingTeam.players.length - 1
  ) {
    innings.status = "completed";
  } else {
    innings.status = "in_progress";
  }
};

const finishMatchIfNeeded = (match) => {
  const first = match.innings.find((i) => i.number === 1);
  const second = match.innings.find((i) => i.number === 2);

  if (!first || !second) return;

  const target = first.runs + 1;

  if (second.runs >= target) {
    match.status = "completed";
    match.winnerIndex = second.battingTeamIndex;
    match.result = `${getTeam(match, second.battingTeamIndex).name} won by ${Math.max(
      0,
      getTeam(match, second.battingTeamIndex).players.length -
        1 -
        second.wickets,
    )} wickets`;
    match.completedAt = new Date();
    return;
  }

  if (second.status === "completed") {
    match.status = "completed";

    if (first.runs > second.runs) {
      match.winnerIndex = first.battingTeamIndex;
      match.result = `${getTeam(match, first.battingTeamIndex).name} won by ${
        first.runs - second.runs
      } runs`;
    } else {
      match.winnerIndex = null;
      match.result = "Match tied";
    }

    match.completedAt = new Date();
  }
};

const emitUpdate = (req, match) => {
  req.app
    .get("io")
    ?.to(`casual-match:${String(match._id)}`)
    .emit("casual-match:updated", { matchId: String(match._id) });
};

// CREATE TEAM
export const createCasualTeam = async (req, res, next) => {
  try {
    const { name, players = [] } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    if (!Array.isArray(players)) {
      return res.status(400).json({ message: "Players must be an array" });
    }

    const cleanPlayers = players
      .map((p) => ({ name: String(p.name || "").trim() }))
      .filter((p) => p.name);

    if (cleanPlayers.length > 30) {
      return res.status(400).json({ message: "Maximum 30 players per team" });
    }

    const team = await CasualTeam.create({
      name: name.trim(),
      owner: getUserId(req),
      members: cleanPlayers,
    });

    res.status(201).json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

// LIST TEAMS
export const listCasualTeams = async (req, res, next) => {
  try {
    const teams = await CasualTeam.find({
      owner: getUserId(req),
      isActive: true,
    }).sort({ updatedAt: -1 });

    res.json({ success: true, teams });
  } catch (error) {
    next(error);
  }
};

// UPDATE TEAM
export const updateCasualTeam = async (req, res, next) => {
  try {
    const team = await CasualTeam.findOne({
      _id: req.params.teamId,
      owner: getUserId(req),
      isActive: true,
    });

    if (!team) return res.status(404).json({ message: "Team not found" });

    if (req.body.name !== undefined) {
      if (!String(req.body.name).trim()) {
        return res.status(400).json({ message: "Team name cannot be empty" });
      }
      team.name = String(req.body.name).trim();
    }

    if (req.body.players !== undefined) {
      if (!Array.isArray(req.body.players) || req.body.players.length > 30) {
        return res.status(400).json({ message: "Invalid player list" });
      }

      team.members = req.body.players
        .map((p) => ({ name: String(p.name || "").trim() }))
        .filter((p) => p.name);
    }

    await team.save();
    res.json({ success: true, team });
  } catch (error) {
    next(error);
  }
};

// ARCHIVE TEAM
export const deleteCasualTeam = async (req, res, next) => {
  try {
    const team = await CasualTeam.findOneAndUpdate(
      { _id: req.params.teamId, owner: getUserId(req) },
      { isActive: false },
      { new: true },
    );

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json({ success: true, message: "Team archived" });
  } catch (error) {
    next(error);
  }
};

// CREATE MATCH
export const createCasualMatch = async (req, res, next) => {
  try {
    const {
      title,
      teamAId,
      teamBId,
      oversPerInnings = 5,
      venue = "",
    } = req.body;

    if (
      !mongoose.isValidObjectId(teamAId) ||
      !mongoose.isValidObjectId(teamBId) ||
      sameId(teamAId, teamBId)
    ) {
      return res.status(400).json({ message: "Select two different teams" });
    }

    const overs = Number(oversPerInnings);
    if (!Number.isInteger(overs) || overs < 1 || overs > 50) {
      return res
        .status(400)
        .json({ message: "Overs must be between 1 and 50" });
    }

    const teams = await CasualTeam.find({
      _id: { $in: [teamAId, teamBId] },
      owner: getUserId(req),
      isActive: true,
    });

    if (teams.length !== 2) {
      return res.status(404).json({ message: "One or both teams not found" });
    }

    const a = teams.find((t) => sameId(t._id, teamAId));
    const b = teams.find((t) => sameId(t._id, teamBId));

    const snapshot = (team) => ({
      teamId: team._id,
      name: team.name,
      players: team.members.map((m) => ({
        memberId: m._id,
        name: m.name,
      })),
    });

    const match = await CasualMatch.create({
      title: String(title || "").trim(),
      createdBy: getUserId(req),
      teamA: snapshot(a),
      teamB: snapshot(b),
      oversPerInnings: overs,
      venue: String(venue || "").trim(),
    });

    res.status(201).json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

// LIST MATCHES
export const listCasualMatches = async (req, res, next) => {
  try {
    const matches = await CasualMatch.find({
      createdBy: getUserId(req),
    }).sort({ createdAt: -1 });

    res.json({ success: true, matches });
  } catch (error) {
    next(error);
  }
};

// GET MATCH
export const getCasualMatch = async (req, res, next) => {
  try {
    const match = await getMatchForOwner(req.params.matchId, getUserId(req));
    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

// START FIRST INNINGS
export const startCasualMatch = async (req, res, next) => {
  try {
    const match = await getMatchForOwner(req.params.matchId, getUserId(req));

    if (match.status !== "scheduled") {
      return res
        .status(400)
        .json({ message: "Match has already started or ended" });
    }

    const battingTeamIndex = Number(req.body.battingTeamIndex) === 1 ? 1 : 0;

    const innings = initializeInnings(
      match,
      1,
      battingTeamIndex,
      req.body.strikerId,
      req.body.nonStrikerId,
      req.body.bowlerId,
    );

    match.innings.push(innings);
    match.currentInnings = 1;
    match.status = "live";
    match.startedAt = new Date();

    await match.save();
    emitUpdate(req, match);

    res.json({ success: true, match });
  } catch (error) {
    if (error.message.startsWith("Select") || error.message.includes("needs")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const scoreCasualBall = async (req, res) => {
  try {
    const { matchId } = req.params;

    const {
      runs = 0,
      extraType = "none",
      extraRuns = 0,
      wicket = false,
      dismissal = "",
      dismissedPlayerId = null,
      incomingPlayerId = null,
      note = "",
      strikerId,
      nonStrikerId,
      bowlerId,
    } = req.body;

    // 1. Validate input
    const validExtraTypes = ["none", "wide", "no_ball", "bye", "leg_bye"];

    if (!validExtraTypes.includes(extraType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid extra type",
      });
    }

    if (!Number.isInteger(Number(runs)) || Number(runs) < 0) {
      return res.status(400).json({
        success: false,
        message: "Runs must be a non-negative integer",
      });
    }

    if (!Number.isInteger(Number(extraRuns)) || Number(extraRuns) < 0) {
      return res.status(400).json({
        success: false,
        message: "Extra runs must be a non-negative integer",
      });
    }

    if (wicket && !dismissedPlayerId) {
      return res.status(400).json({
        success: false,
        message: "Please select the dismissed player",
      });
    }

    // 2. Get match and validate ownership
    const match = await getMatchForOwner(matchId, req.user._id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (match.status !== "live") {
      return res.status(400).json({
        success: false,
        message: "Match is not live",
      });
    }

    const innings = getCurrentInnings(match);

    if (!innings || innings.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "No live innings found",
      });
    }

    // 3. Get batting and bowling teams
    const battingTeam = getBattingTeam(match, innings);
    const bowlingTeam = getBowlingTeam(match, innings);

    if (!battingTeam || !bowlingTeam) {
      return res.status(400).json({
        success: false,
        message: "Invalid batting or bowling team",
      });
    }

    // 4. Validate players
    const striker = validPlayer(battingTeam, strikerId);
    const nonStriker = validPlayer(battingTeam, nonStrikerId);
    const bowler = validPlayer(bowlingTeam, bowlerId);

    if (!striker || !nonStriker || !bowler) {
      return res.status(400).json({
        success: false,
        message: "Invalid striker, non-striker, or bowler",
      });
    }

    if (sameId(strikerId, nonStrikerId)) {
      return res.status(400).json({
        success: false,
        message: "Striker and non-striker cannot be the same",
      });
    }

    // 5. Validate current batting players
    if (innings.strikerId && !sameId(innings.strikerId, strikerId)) {
      return res.status(400).json({
        success: false,
        message: "Selected striker does not match the current striker",
      });
    }

    if (innings.nonStrikerId && !sameId(innings.nonStrikerId, nonStrikerId)) {
      return res.status(400).json({
        success: false,
        message: "Selected non-striker does not match the current non-striker",
      });
    }

    // 6. Calculate ball details
    const isIllegalDelivery = ["wide", "no_ball"].includes(extraType);

    const legal = !isIllegalDelivery;

    const totalRuns = Number(runs) + Number(extraRuns);

    const nextLegalBall = innings.legalBalls + (legal ? 1 : 0);

    // 7. Prepare strike positions
    let strikerAfterId = strikerId;
    let nonStrikerAfterId = nonStrikerId;

    /*
      Strike rotation calculation:

      Normal runs:
        Rotate based on batter runs.

      Bye / Leg bye:
        Rotate based on batter runs + bye/leg-bye extras.

      Wide / No-ball:
        The penalty run does not count for strike rotation.
        Additional runs are counted.
    */
    const runsForStrikeRotation =
      Number(runs) +
      (["bye", "leg_bye"].includes(extraType) ? Number(extraRuns) : 0) +
      (["wide", "no_ball"].includes(extraType)
        ? Math.max(0, Number(extraRuns) - 1)
        : 0);

    // Rotate strike for odd completed runs
    if (runsForStrikeRotation % 2 === 1) {
      [strikerAfterId, nonStrikerAfterId] = [nonStrikerAfterId, strikerAfterId];
    }

    // Rotate strike at the end of every completed over
    if (legal && nextLegalBall % 6 === 0) {
      [strikerAfterId, nonStrikerAfterId] = [nonStrikerAfterId, strikerAfterId];
    }

    // 8. Validate wicket details
    let incomingPlayer = null;

    if (wicket) {
      if (!dismissal) {
        return res.status(400).json({
          success: false,
          message: "Please select a dismissal type",
        });
      }

      const dismissedPlayer = validPlayer(battingTeam, dismissedPlayerId);

      if (!dismissedPlayer) {
        return res.status(400).json({
          success: false,
          message: "Invalid dismissed player",
        });
      }

      if (
        !sameId(dismissedPlayerId, strikerId) &&
        !sameId(dismissedPlayerId, nonStrikerId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Dismissed player must be at the crease",
        });
      }

      const dismissedWasStriker = sameId(dismissedPlayerId, strikerId);

      // Find players who have not already batted
      const alreadyBatted = new Set(
        (innings.battingStats || []).map((player) => String(player.playerId)),
      );

      const availablePlayers = battingTeam.players.filter(
        (player) =>
          !alreadyBatted.has(String(player.memberId)) &&
          !sameId(player.memberId, strikerId) &&
          !sameId(player.memberId, nonStrikerId),
      );

      // A final wicket must be allowed without an incoming batter
      const isFinalWicket =
        innings.wickets + 1 >= battingTeam.players.length - 1;

      if (!isFinalWicket) {
        if (!incomingPlayerId) {
          return res.status(400).json({
            success: false,
            message: "Please select the incoming batter",
          });
        }

        incomingPlayer = validPlayer(battingTeam, incomingPlayerId);

        if (
          !incomingPlayer ||
          !availablePlayers.some((player) =>
            sameId(player.memberId, incomingPlayerId),
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid incoming batter",
          });
        }

        if (sameId(incomingPlayerId, dismissedPlayerId)) {
          return res.status(400).json({
            success: false,
            message: "Incoming batter cannot be the dismissed player",
          });
        }
      }

      // Replace the dismissed player at their end
      if (dismissedWasStriker) {
        strikerAfterId = incomingPlayer
          ? incomingPlayer.memberId
          : strikerAfterId;
      } else {
        nonStrikerAfterId = incomingPlayer
          ? incomingPlayer.memberId
          : nonStrikerAfterId;
      }
    }

    // 9. Create ball event
    const event = {
      sequence: (innings.events?.length || 0) + 1,

      runs: Number(runs),
      extraType,
      extraRuns: Number(extraRuns),
      totalRuns,

      legal,
      wicket: Boolean(wicket),

      note,

      strikerId,
      nonStrikerId,
      bowlerId,

      dismissedPlayerId: wicket ? dismissedPlayerId : null,

      incomingPlayerId: incomingPlayer ? incomingPlayer.memberId : null,

      dismissal: wicket ? dismissal : "",

      strikerAfterId,
      nonStrikerAfterId,

      createdAt: new Date(),
    };

    // 10. Save event
    innings.events.push(event);

    // 11. Recalculate scorecard and innings totals
    rebuildInnings(match, innings, battingTeam, bowlingTeam);

    // Preserve the final strike positions after rebuilding
    innings.strikerId = strikerAfterId;
    innings.nonStrikerId = nonStrikerAfterId;
    innings.bowlerId = bowlerId;

    // 12. Save match
    await match.save();

    // 13. Notify connected clients, if Socket.IO is configured
    const io = req.app.get("io");

    if (io) {
      io.to(`casual-match:${match._id}`).emit("casual-match:updated", {
        matchId: String(match._id),
      });
    }

    // 14. Return updated match
    return res.status(200).json({
      success: true,
      message: "Ball recorded successfully",
      match,
      currentOvers: oversText(innings.legalBalls),
    });
  } catch (error) {
    console.error("scoreCasualBall error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to record ball",
    });
  }
};

// START SECOND INNINGS
export const startSecondInnings = async (req, res, next) => {
  try {
    const match = await getMatchForOwner(req.params.matchId, getUserId(req));
    const first = match.innings.find((i) => i.number === 1);

    if (
      match.status !== "live" ||
      !first ||
      first.status !== "completed" ||
      match.innings.some((i) => i.number === 2)
    ) {
      return res.status(400).json({
        message: "First innings must finish before starting the second",
      });
    }

    const battingTeamIndex = first.battingTeamIndex === 0 ? 1 : 0;

    const innings = initializeInnings(
      match,
      2,
      battingTeamIndex,
      req.body.strikerId,
      req.body.nonStrikerId,
      req.body.bowlerId,
    );

    match.innings.push(innings);
    match.currentInnings = 2;

    await match.save();
    emitUpdate(req, match);

    res.json({ success: true, match });
  } catch (error) {
    if (error.message.startsWith("Select") || error.message.includes("needs")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// UNDO LAST BALL
export const undoCasualBall = async (req, res, next) => {
  try {
    const match = await getMatchForOwner(req.params.matchId, getUserId(req));
    const innings = getCurrentInnings(match);

    if (!innings || innings.events.length === 0) {
      return res.status(400).json({ message: "There is no ball to undo" });
    }

    innings.events.pop();

    // Reopen the innings and match before rebuilding.
    innings.status = "in_progress";
    match.status = "live";
    match.result = "";
    match.winnerIndex = null;
    match.completedAt = null;

    rebuildInnings(match, innings);

    await match.save();
    emitUpdate(req, match);

    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
};

// FINISH INNINGS
export const finishCasualInnings = async (req, res, next) => {
  try {
    const match = await getMatchForOwner(req.params.matchId, getUserId(req));
    const innings = getCurrentInnings(match);

    if (!innings || innings.status !== "in_progress") {
      return res.status(400).json({ message: "No active innings" });
    }

    innings.status = "completed";

    if (innings.number === 2) {
      finishMatchIfNeeded(match);

      if (match.status !== "completed") {
        match.status = "completed";
        match.result =
          innings.runs === match.innings[0].runs
            ? "Match tied"
            : innings.runs > match.innings[0].runs
              ? "Chasing team won"
              : "Defending team won";
        match.completedAt = new Date();
      }
    }

    await match.save();
    emitUpdate(req, match);

    res.json({ success: true, match });
  } catch (error) {
    next(error);
  }
};
