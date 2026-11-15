import Match from "../models/Match.js";
import Innings from "../models/Innings.js";
import Delivery from "../models/Delivery.js";

const queues = new Map();
const outs = new Set([
  "bowled",
  "caught",
  "lbw",
  "stumped",
  "run_out",
  "hit_wicket",
  "obstructing_the_field",
]);
const sid = (x) => String(x?._id || x || "");
const isWicket = (w) => Boolean(w?.kind && outs.has(w.kind));

async function validateBowlerSelection(match, inn, bowler) {
  if (!bowler) return;

  const maxBowlerOvers = Math.ceil(Number(match.oversPerInnings) / 5);

  const stats = inn.bowlingStats.find(
    (item) => sid(item.player) === sid(bowler),
  );

  if (maxBowlerOvers > 0 && (stats?.legalBalls || 0) >= maxBowlerOvers * 6) {
    throw new Error(
      `This bowler has completed the maximum quota of ${maxBowlerOvers} overs`,
    );
  }

  const completedOvers = Math.floor(inn.legalBalls / 6);

  if (completedOvers > 0) {
    const lastOverDelivery = await Delivery.findOne({
      innings: inn._id,
      overNumber: completedOvers,
    })
      .sort({ sequence: -1 })
      .select("bowler");

    if (lastOverDelivery && sid(lastOverDelivery.bowler) === sid(bowler)) {
      throw new Error(
        "The previous over's bowler cannot bowl consecutive overs",
      );
    }
  }
}

async function queued(id, fn) {
  const key = String(id),
    prior = queues.get(key) || Promise.resolve();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const tail = prior.then(() => gate);
  queues.set(key, tail);
  await prior;
  try {
    return await fn();
  } finally {
    release();
    if (queues.get(key) === tail) queues.delete(key);
  }
}

async function rebuild(inningsId) {
  const inn = await Innings.findById(inningsId);
  const ds = await Delivery.find({ innings: inningsId }).sort({ sequence: 1 });
  let total = 0,
    wickets = 0,
    balls = 0;
  let striker = null,
    nonStriker = null,
    currentBowler = null;
  const bat = new Map(),
    bowl = new Map();

  const B = (id) => {
    const k = sid(id);
    if (!bat.has(k))
      bat.set(k, {
        player: id,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        dismissal: "",
      });
    return bat.get(k);
  };
  const W = (id) => {
    const k = sid(id);
    if (!bowl.has(k))
      bowl.set(k, {
        player: id,
        runsConceded: 0,
        wickets: 0,
        legalBalls: 0,
        wides: 0,
        noBalls: 0,
      });
    return bowl.get(k);
  };

  for (const d of ds) {
    if (!striker) {
      striker = sid(d.striker);
      nonStriker = sid(d.nonStriker);
    }
    const bs = B(d.striker),
      ws = W(d.bowler);
    total += d.totalRuns;
    bs.runs += d.batterRuns;
    if (d.isLegalDelivery) {
      balls++;
      bs.balls++;
      ws.legalBalls++;
    }
    if (d.batterRuns === 4) bs.fours++;
    if (d.batterRuns === 6) bs.sixes++;
    ws.runsConceded +=
      d.totalRuns -
      (["bye", "leg_bye"].includes(d.extraType) ? d.extraRuns : 0);
    if (d.extraType === "wide") ws.wides += d.extraRuns;
    if (d.extraType === "no_ball") ws.noBalls += d.extraRuns;

    // Apply running runs and end-of-over rotation before clearing a dismissed batter.
    if (d.totalRuns % 2) [striker, nonStriker] = [nonStriker, striker];
    if (d.isLegalDelivery && d.ballInOver === 6) {
      [striker, nonStriker] = [nonStriker, striker];
      currentBowler = null;
    } else {
      currentBowler = sid(d.bowler);
    }

    if (d.wicket?.batter) {
      const dismissed = sid(d.wicket.batter);
      if (isWicket(d.wicket)) {
        wickets++;
        ws.wickets++;
        B(d.wicket.batter).isOut = true;
        B(d.wicket.batter).dismissal = d.wicket.kind;
      }
      if (dismissed === striker) striker = null;
      if (dismissed === nonStriker) nonStriker = null;
    }
  }

  inn.totalRuns = total;
  inn.wickets = wickets;
  inn.legalBalls = balls;
  inn.striker = striker || null;
  inn.nonStriker = nonStriker || null;
  inn.currentBowler = currentBowler || null;
  inn.battingStats = [...bat.values()];
  inn.bowlingStats = [...bowl.values()];
  await inn.save();
  return inn;
}

export async function startInnings({
  matchId,
  number,
  battingTeam,
  striker,
  nonStriker,
  bowler,
  createdBy,
}) {
  const match = await Match.findById(matchId);

  if (!match) throw new Error("Match not found");

  if (match.status === "completed" || match.status === "abandoned") {
    throw new Error("Match is not active");
  }

  if (!createdBy) {
    throw new Error("Created by user is required");
  }

  // Check existing match creator BEFORE creating innings.
  if (!match.createdBy) {
    throw new Error(
      "Match has no createdBy. Repair the match record before starting innings.",
    );
  }

  if (sid(striker) === sid(nonStriker)) {
    throw new Error("Choose two different batters");
  }

  if (![sid(match.teamA), sid(match.teamB)].includes(sid(battingTeam))) {
    throw new Error("Invalid batting team");
  }

  if (await Innings.exists({ match: matchId, number })) {
    throw new Error("Innings already exists");
  }

  const bowlingTeam =
    sid(battingTeam) === sid(match.teamA) ? match.teamB : match.teamA;

  const inn = await Innings.create({
    match: matchId,
    number,
    battingTeam,
    bowlingTeam,
    striker,
    nonStriker,
    currentBowler: bowler,
    createdBy,
    status: "in_progress",
  });

  match.status = "live";
  match.currentInnings = number;
  match.startedAt ||= new Date();

  await match.save();

  return inn;
}

export async function setPlayers({
  matchId,
  inningsId,
  striker,
  nonStriker,
  bowler,
}) {
  const [match, inn] = await Promise.all([
    Match.findById(matchId),
    Innings.findOne({
      _id: inningsId,
      match: matchId,
      status: "in_progress",
    }),
  ]);

  if (!match || !inn) {
    throw new Error("Active innings or match not found");
  }

  const nextStriker = striker !== undefined ? striker : inn.striker;

  const nextNonStriker = nonStriker !== undefined ? nonStriker : inn.nonStriker;

  const nextBowler = bowler !== undefined ? bowler : inn.currentBowler;

  if (
    nextStriker &&
    nextNonStriker &&
    sid(nextStriker) === sid(nextNonStriker)
  ) {
    throw new Error("Choose two different batters");
  }

  const dismissedIds = new Set(
    inn.battingStats
      .filter((stat) => stat.isOut)
      .map((stat) => sid(stat.player)),
  );

  if (
    (nextStriker && dismissedIds.has(sid(nextStriker))) ||
    (nextNonStriker && dismissedIds.has(sid(nextNonStriker)))
  ) {
    throw new Error("A dismissed batter cannot return to the crease");
  }

  await validateBowlerSelection(match, inn, nextBowler);

  inn.striker = nextStriker || null;
  inn.nonStriker = nextNonStriker || null;
  inn.currentBowler = nextBowler || null;

  await inn.save();

  return inn;
}

export async function addDelivery({ matchId, inningsId, payload, userId }) {
  return queued(matchId, async () => {
    const match = await Match.findById(matchId),
      inn = await Innings.findOne({ _id: inningsId, match: matchId });
    if (!match || !inn) throw new Error("Match or innings not found");
    if (match.status !== "live" || inn.status !== "in_progress")
      throw new Error("Innings is not live");
    if (!inn.striker || !inn.nonStriker || !inn.currentBowler)
      throw new Error("Select striker, non-striker and bowler");

    await validateBowlerSelection(match, inn, inn.currentBowler);

    const extraType = payload.extraType || "none",
      batterRuns = Number(payload.batterRuns || 0),
      extraRuns = Number(payload.extraRuns || 0);
    if (!["none", "wide", "no_ball", "bye", "leg_bye"].includes(extraType))
      throw new Error("Invalid extra type");
    if (
      !Number.isInteger(batterRuns) ||
      batterRuns < 0 ||
      batterRuns > 6 ||
      !Number.isInteger(extraRuns) ||
      extraRuns < 0
    )
      throw new Error("Invalid runs");
    if (["wide", "no_ball"].includes(extraType) && extraRuns < 1)
      throw new Error("Wide/no-ball must include at least one extra");
    if (["bye", "leg_bye"].includes(extraType) && batterRuns !== 0)
      throw new Error("Bye/leg-bye cannot add batter runs");
    const wicket = payload.wicket || null;
    if (wicket && ![...outs, "retired_hurt"].includes(wicket.kind))
      throw new Error("Invalid dismissal type");
    if (
      wicket &&
      ![sid(inn.striker), sid(inn.nonStriker)].includes(sid(wicket.batter))
    )
      throw new Error("Dismissed player must be at the crease");
    const legal = !["wide", "no_ball"].includes(extraType),
      prior = inn.legalBalls;
    const overNumber = Math.floor(prior / 6) + 1,
      ballInOver = legal ? (prior % 6) + 1 : Math.max(1, prior % 6);
    const last = await Delivery.findOne({ innings: inningsId })
      .sort({ sequence: -1 })
      .select("sequence");
    const totalRuns = batterRuns + extraRuns;
    const delivery = await Delivery.create({
      match: matchId,
      innings: inningsId,
      sequence: (last?.sequence || 0) + 1,
      overNumber,
      ballInOver,
      striker: inn.striker,
      nonStriker: inn.nonStriker,
      bowler: inn.currentBowler,
      batterRuns,
      extraType,
      extraRuns,
      totalRuns,
      isLegalDelivery: legal,
      wicket,
      recordedBy: userId,
    });
    let s = sid(inn.striker),
      ns = sid(inn.nonStriker);
    if (totalRuns % 2) [s, ns] = [ns, s];
    if (legal && ballInOver === 6) [s, ns] = [ns, s];
    if (wicket?.batter) {
      if (s === sid(wicket.batter)) s = null;
      if (ns === sid(wicket.batter)) ns = null;
    }
    inn.striker = s;
    inn.nonStriker = ns;
    if (legal && ballInOver === 6) inn.currentBowler = null;
    await inn.save();
    const updated = await rebuild(inningsId);
    if (
      updated.legalBalls >= match.oversPerInnings * 6 ||
      updated.wickets >= 10
    ) {
      updated.status = "completed";
      await updated.save();
    }
    return { delivery, innings: updated };
  });
}

export async function undoLast({ matchId, inningsId }) {
  return queued(matchId, async () => {
    const match = await Match.findById(matchId),
      inn = await Innings.findOne({ _id: inningsId, match: matchId });
    if (!match || !inn) throw new Error("Match or innings not found");
    const last = await Delivery.findOne({ innings: inningsId }).sort({
      sequence: -1,
    });
    if (!last) throw new Error("No delivery to undo");
    await last.deleteOne();
    inn.status = "in_progress";
    await inn.save();
    return rebuild(inningsId);
  });
}

export async function endInnings({ matchId, inningsId }) {
  const inn = await Innings.findOne({ _id: inningsId, match: matchId });
  if (!inn) throw new Error("Innings not found");
  inn.status = "completed";
  await inn.save();
  return inn;
}

export async function snapshot(matchId) {
  const match = await Match.findById(matchId)
    .populate("teamA", "name")
    .populate("teamB", "name")
    .populate("scorer", "name");

  if (!match) return null;

  const innings = await Innings.find({ match: matchId })
    .populate("battingTeam", "name")
    .populate("bowlingTeam", "name")
    .populate("striker", "fullName")
    .populate("nonStriker", "fullName")
    .populate("currentBowler", "fullName")
    .populate("battingStats.player", "fullName")
    .populate("bowlingStats.player", "fullName")
    .sort({ number: 1 });

  const recentDeliveries = await Delivery.find({ match: matchId })
    .populate("striker", "fullName")
    .populate("bowler", "fullName")
    .sort({ createdAt: -1 })
    .limit(12);

  const activeInnings = [...innings]
    .reverse()
    .find((item) => item.status === "in_progress");

  let lastCompletedOverBowler = null;

  if (activeInnings) {
    const completedOvers = Math.floor(activeInnings.legalBalls / 6);

    if (completedOvers > 0) {
      const lastOverDelivery = await Delivery.findOne({
        innings: activeInnings._id,
        overNumber: completedOvers,
      })
        .sort({ sequence: -1 })
        .populate("bowler", "fullName");

      lastCompletedOverBowler = lastOverDelivery?.bowler || null;
    }
  }

  return {
    match,
    innings,
    recentDeliveries,
    lastCompletedOverBowler,
  };
}
