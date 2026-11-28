import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import Tournament from "../models/Tournament.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";

const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const validId = (id) => mongoose.isValidObjectId(id);

async function getAuction(auctionId) {
  if (!validId(auctionId)) throw fail("Invalid auction ID.");

  const auction = await Auction.findById(auctionId);
  if (!auction) throw fail("Auction not found.", 404);

  if (!["SNAKE_DRAFT", "DIRECT_SELECTION"].includes(auction.auctionFormat)) {
    throw fail("This operation is not available for this auction format.", 409);
  }

  return auction;
}

async function getApprovedTeams(auction) {
  return Team.find({
    organization: auction.organization,
    tournament: auction.tournament,
    approvalStatus: "approved",
  }).sort({ createdAt: 1, _id: 1 });
}

async function getTeamForOwner(auction, teamId, userId) {
  if (!validId(teamId)) throw fail("Invalid team ID.");

  const team = await Team.findOne({
    _id: teamId,
    organization: auction.organization,
    tournament: auction.tournament,
    primaryOwner: userId,
    approvalStatus: "approved",
  });

  if (!team)
    throw fail("You do not own an approved team in this tournament.", 403);
  return team;
}

async function getAvailablePlayer(auction, playerId) {
  if (!validId(playerId)) throw fail("Invalid player ID.");

  const player = await Player.findOne({
    _id: playerId,
    tournament: auction.tournament,
    approvalStatus: "approved",
    auctionStatus: "AVAILABLE",
  });

  if (!player) throw fail("Player is not available for selection.", 409);
  return player;
}

async function getTournament(auction) {
  const tournament = await Tournament.findOne({
    _id: auction.tournament,
    organization: auction.organization,
  });

  if (!tournament) throw fail("Tournament not found.", 404);
  return tournament;
}

function assertTeamHasRoom(team, tournament) {
  const maxSquadSize = Number(tournament.squadSize || 13);

  if ((team.squad || []).length >= maxSquadSize) {
    throw fail(`Team squad is full. Maximum size is ${maxSquadSize}.`, 409);
  }
}

async function assignPlayer({ auction, team, player, userId, price = 0 }) {
  const tournament = await getTournament(auction);

  assertTeamHasRoom(team, tournament);

  const amount = Number(price);

  if (!Number.isFinite(amount) || amount < 0) {
    throw fail("Invalid player selection price.");
  }

  if (Number(team.purseRemaining || 0) < amount) {
    throw fail("Insufficient team purse.", 409);
  }

  // Guard against two teams selecting the same player simultaneously.
  const claimedPlayer = await Player.findOneAndUpdate(
    {
      _id: player._id,
      tournament: auction.tournament,
      approvalStatus: "approved",
      auctionStatus: "AVAILABLE",
    },
    {
      $set: {
        auctionStatus: "SOLD",
        soldTo: team._id,
        soldPrice: amount,
      },
    },
    { new: true },
  );

  if (!claimedPlayer) {
    throw fail("This player has just been selected by another team.", 409);
  }

  const updatedTeam = await Team.findOneAndUpdate(
    {
      _id: team._id,
      organization: auction.organization,
      tournament: auction.tournament,
      approvalStatus: "approved",
      purseRemaining: { $gte: amount },
      $expr: {
        $lt: [
          { $size: { $ifNull: ["$squad", []] } },
          getMaxSquadSize(tournament),
        ],
      },
    },
    {
      $inc: { purseRemaining: -amount },
      $addToSet: { squad: claimedPlayer._id },
    },
    { new: true },
  );

  if (!updatedTeam) {
    // Restore player availability if the team update failed.
    await Player.updateOne(
      {
        _id: claimedPlayer._id,
        auctionStatus: "SOLD",
        soldTo: team._id,
      },
      {
        $set: {
          auctionStatus: "AVAILABLE",
          soldTo: null,
          soldPrice: null,
        },
      },
    );

    throw fail(
      "Team purse or squad capacity changed. Refresh and try again.",
      409,
    );
  }

  return { player: claimedPlayer, team: updatedTeam };
}

/**
 * Initialize Snake Draft.
 * Team order is based on approved team creation order.
 * The first round moves forward; the next round reverses.
 */
export async function initializeSnakeDraft(auctionId, userId) {
  const auction = await getAuction(auctionId);

  if (auction.auctionFormat !== "SNAKE_DRAFT") {
    throw fail("This auction is not configured for Snake Draft.");
  }

  if (auction.draft?.initialized) {
    throw fail("Snake Draft has already been initialized.", 409);
  }

  if (auction.status !== "IDLE") {
    throw fail("Auction must be idle before initializing the draft.", 409);
  }

  const teams = await getApprovedTeams(auction);

  if (teams.length < 2) {
    throw fail("At least two approved teams are required.", 409);
  }

  auction.draft = {
    initialized: true,
    completed: false,
    teamOrder: teams.map((team) => team._id),
    currentIndex: 0,
    currentRound: 1,
    pickNumber: 0,
    picks: [],
  };

  auction.updatedBy = userId;
  await auction.save();

  return getDraftSnapshot(auctionId);
}

/**
 * Make the current Snake Draft pick.
 * A team can only pick when it is its turn.
 */
export async function makeSnakeDraftPick({
  auctionId,
  teamId,
  playerId,
  userId,
}) {
  const auction = await getAuction(auctionId);

  if (!auction.draft?.initialized || auction.draft.completed) {
    throw fail("Snake Draft is not active.", 409);
  }

  const order = auction.draft.teamOrder || [];
  const currentTeamId = order[auction.draft.currentIndex];

  if (!currentTeamId || String(currentTeamId) !== String(teamId)) {
    throw fail("It is not this team's turn to pick.", 403);
  }

  const team = await getTeamForOwner(auction, teamId, userId);
  const player = await getAvailablePlayer(auction, playerId);

  // Flat selection price; set selectionPrice on Auction to charge for picks.
  const price = Number(auction.selectionPrice || 0);

  const assigned = await assignPlayer({
    auction,
    team,
    player,
    userId,
    price,
  });

  const pickNumber = Number(auction.draft.pickNumber || 0) + 1;
  const round = Number(auction.draft.currentRound || 1);

  auction.draft.picks.push({
    round,
    pickNumber,
    team: team._id,
    player: player._id,
    pickedBy: userId,
    pickedAt: new Date(),
  });

  const nextIndex = auction.draft.currentIndex + 1;

  if (nextIndex < order.length) {
    auction.draft.currentIndex = nextIndex;
  } else {
    const nextRound = round + 1;
    const reverseOrder = nextRound % 2 === 0;

    auction.draft.currentRound = nextRound;
    auction.draft.currentIndex = reverseOrder ? order.length - 1 : 0;
  }

  // Complete the draft once all approved players have been selected
  // or every team has reached its squad size.
  const tournament = await getTournament(auction);
  const teams = await getApprovedTeams(auction);

  const allTeamsFull = teams.every(
    (item) =>
      (item._id.equals(team._id)
        ? assigned.team.squad.length
        : (item.squad || []).length) >= Number(tournament.squadSize || 13),
  );

  const remainingPlayers = await Player.countDocuments({
    tournament: auction.tournament,
    approvalStatus: "approved",
    auctionStatus: "AVAILABLE",
  });

  if (allTeamsFull || remainingPlayers === 0) {
    auction.draft.completed = true;
    auction.status = "COMPLETED";
  }

  auction.updatedBy = userId;
  await auction.save();

  return getDraftSnapshot(auctionId);
}

/**
 * Direct Selection.
 * Team owners can select any approved, available player.
 */
export async function makeDirectSelection({
  auctionId,
  teamId,
  playerId,
  userId,
}) {
  const auction = await getAuction(auctionId);

  if (auction.auctionFormat !== "DIRECT_SELECTION") {
    throw fail("This auction is not configured for Direct Selection.");
  }

  if (auction.status === "COMPLETED") {
    throw fail("This auction has been completed.", 409);
  }

  const team = await getTeamForOwner(auction, teamId, userId);
  const player = await getAvailablePlayer(auction, playerId);

  const price = Number(auction.selectionPrice || 0);

  const assigned = await assignPlayer({
    auction,
    team,
    player,
    userId,
    price,
  });

  auction.directSelections.push({
    team: assigned.team._id,
    player: assigned.player._id,
    selectedBy: userId,
    selectedAt: new Date(),
  });

  auction.updatedBy = userId;
  await auction.save();

  return getDirectSelectionSnapshot(auctionId);
}

export async function getDraftSnapshot(auctionId) {
  const auction = await Auction.findById(auctionId)
    .populate("draft.teamOrder", "name purseRemaining squad")
    .populate("draft.picks.team", "name")
    .populate("draft.picks.player", "fullName category role photo")
    .populate("draft.picks.pickedBy", "name");

  if (!auction) throw fail("Auction not found.", 404);

  const currentTeam =
    auction.draft?.teamOrder?.[auction.draft.currentIndex] || null;

  return {
    auction,
    currentTeam,
  };
}

export async function getDirectSelectionSnapshot(auctionId, user) {
  let auction = await Auction.findById(auctionId);

  if (!auction) {
    throw fail("Auction not found.", 404);
  }

  auction = await syncDirectAuctionSchedule(auction);

  const isManager =
    ["super_admin", "admin", "org_admin"].includes(user?.role) ||
    (user?.role === "auctioneer" &&
      (auction.assignedAuctioneers || []).some(
        (id) => String(id?._id || id) === String(user?._id),
      ));

  const result = await Auction.findById(auctionId)
    .populate("directAuction.submissions.team", "name primaryOwner")
    .populate(
      "directAuction.submissions.bids.player",
      "fullName category role photo",
    )
    .populate("directAuction.awards.team", "name")
    .populate("directAuction.awards.player", "fullName category role photo")
    .populate("directSelections.team", "name")
    .populate("directSelections.player", "fullName category role photo");

  const data = result.toObject();

  if (!isManager) {
    const ownedTeam = await Team.findOne({
      organization: auction.organization,
      tournament: auction.tournament,
      primaryOwner: user?._id,
      approvalStatus: "approved",
    }).select("_id");

    data.directAuction.submissions = data.directAuction.submissions.filter(
      (submission) =>
        ownedTeam &&
        String(submission.team?._id || submission.team) ===
          String(ownedTeam._id),
    );
  }

  return { auction: data };
}

const DEFAULT_CATEGORY_LIMITS = {
  ICONIC: { min: 5000, max: 15000 },
  A: { min: 3000, max: 10000 },
  B: { min: 2000, max: 7000 },
  C: { min: 1000, max: 5000 },
  D: { min: 500, max: 3000 },
};

function getCategoryLimit(auction, category) {
  const configured = auction.directAuction.categoryLimits?.get
    ? auction.directAuction.categoryLimits.get(category)
    : auction.directAuction.categoryLimits?.[category];

  return configured || DEFAULT_CATEGORY_LIMITS[category];
}

function getPlayerLimit(auction, playerId, category) {
  const override = auction.directAuction.playerBidLimits.find((item) =>
    sameId(item.player, playerId),
  );

  return override || getCategoryLimit(auction, category);
}

function validateBidAmount(amount, limits) {
  const value = Number(amount);

  if (!Number.isSafeInteger(value)) {
    throw fail("Bid must be a whole number.", 400);
  }

  if (!limits) {
    throw fail("Bid limits are not configured for this player category.");
  }

  if (value < limits.min || value > limits.max) {
    throw fail(`Bid must be between ₹${limits.min} and ₹${limits.max}.`, 400);
  }

  return value;
}

function getSubmission(auction, teamId) {
  return auction.directAuction.submissions.find((submission) =>
    sameId(submission.team, teamId),
  );
}

function getDirectTeamPlayerCount(team) {
  return (team.squad || []).length;
}

function assertDirectSubmissionOpen(auction) {
  if (auction.auctionFormat !== "DIRECT_SELECTION") {
    throw fail("This auction is not configured for Direct Selection.", 409);
  }

  if (auction.directAuction.status !== "SUBMISSION_OPEN") {
    throw fail("Bid submissions are not currently open.", 409);
  }

  const deadline = auction.directAuction.submissionDeadline;

  if (deadline && new Date(deadline).getTime() <= Date.now()) {
    throw fail("The submission deadline has passed.", 409);
  }
}

function assertCanAward(auction) {
  if (!["REVIEW", "TIE_BREAK"].includes(auction.directAuction.status)) {
    throw fail("Close submissions before awarding players.", 409);
  }
}

/**
 * Organizer opens the submission window.
 */
export async function openDirectSubmissions({
  auctionId,
  deadline,
  categoryLimits,
  userId,
}) {
  const auction = await getAuction(auctionId);

  if (auction.auctionFormat !== "DIRECT_SELECTION") {
    throw fail("This auction is not configured for Direct Selection.");
  }

  if (auction.directAuction.status !== "DRAFT") {
    throw fail("Submissions can only be opened from DRAFT status.", 409);
  }

  const parsedDeadline = deadline ? new Date(deadline) : null;

  if (
    !parsedDeadline ||
    Number.isNaN(parsedDeadline.getTime()) ||
    parsedDeadline.getTime() <= Date.now()
  ) {
    throw fail("Please provide a valid future submission deadline.");
  }

  if (categoryLimits) {
    for (const [category, limits] of Object.entries(categoryLimits)) {
      if (!["ICONIC", "A", "B", "C", "D"].includes(category)) {
        throw fail(`Invalid player category: ${category}`);
      }

      const min = Number(limits.min);
      const max = Number(limits.max);

      if (
        !Number.isSafeInteger(min) ||
        !Number.isSafeInteger(max) ||
        min < 0 ||
        max < min
      ) {
        throw fail(`Invalid bid limits for ${category}.`);
      }
    }

    auction.directAuction.categoryLimits = {
      ...DEFAULT_CATEGORY_LIMITS,
      ...categoryLimits,
    };
  }

  auction.directAuction.status = "SUBMISSION_OPEN";
  auction.directAuction.submissionDeadline = parsedDeadline;
  auction.updatedBy = userId;

  await auction.save();

  return getDirectSelectionSnapshot(auctionId);
}

/**
 * Team owner submits one sealed batch.
 * A team cannot modify its submission after sending it.
 */
export async function submitDirectBids({ auctionId, teamId, bids, userId }) {
  let auction = await getAuction(auctionId);
  auction = await syncDirectAuctionSchedule(auction);

  assertDirectSubmissionOpen(auction);

  const team = await getTeamForOwner(auction, teamId, userId);

  if (getSubmission(auction, team._id)) {
    throw fail("Your bid submission is already locked.", 409);
  }

  if (!Array.isArray(bids) || bids.length === 0) {
    throw fail("Select at least one player and enter a bid.");
  }

  const maxSquadSize = 13;
  const currentSquadSize = getDirectTeamPlayerCount(team);
  const remainingSlots = Math.max(0, maxSquadSize - currentSquadSize);

  if (remainingSlots === 0) {
    throw fail("Your team has already reached the 13-player limit.", 409);
  }

  if (bids.length > remainingSlots) {
    throw fail(
      `Your team has only ${remainingSlots} squad slots remaining.`,
      409,
    );
  }

  const playerIds = bids.map((bid) => String(bid.player));

  if (
    playerIds.some((id) => !validId(id)) ||
    new Set(playerIds).size !== playerIds.length
  ) {
    throw fail("Invalid or duplicate player selection.");
  }

  const players = await Player.find({
    _id: { $in: playerIds },
    tournament: auction.tournament,
    approvalStatus: "approved",
    auctionStatus: "AVAILABLE",
  });

  if (players.length !== bids.length) {
    throw fail("One or more selected players are no longer available.", 409);
  }

  const playerMap = new Map(
    players.map((player) => [String(player._id), player]),
  );

  let totalBid = 0;

  const cleanBids = bids.map((bid) => {
    const player = playerMap.get(String(bid.player));

    const limits = getPlayerLimit(auction, player._id, player.category);

    const amount = validateBidAmount(bid.amount, limits);

    totalBid += amount;

    return {
      player: player._id,
      amount,
    };
  });

  if (totalBid > Number(team.purseRemaining || 0)) {
    throw fail("Your total submitted bids exceed your remaining purse.");
  }

  // Atomic lock: prevents simultaneous duplicate submissions.
  const updatedAuction = await Auction.findOneAndUpdate(
    {
      _id: auction._id,
      auctionFormat: "DIRECT_SELECTION",
      "directAuction.status": "SUBMISSION_OPEN",
      "directAuction.submissions.team": { $ne: team._id },
      $or: [
        { "directAuction.submissionDeadline": null },
        { "directAuction.submissionDeadline": { $gt: new Date() } },
      ],
    },
    {
      $push: {
        "directAuction.submissions": {
          team: team._id,
          submittedBy: userId,
          submittedAt: new Date(),
          bids: cleanBids,
        },
      },
    },
    { new: true },
  );

  if (!updatedAuction) {
    throw fail(
      "Submission window closed or your team has already submitted.",
      409,
    );
  }

  return {
    success: true,
    message: "Your sealed bids have been submitted and locked.",
  };
}

/**
 * Organizer closes submissions and moves auction to review.
 */
export async function closeDirectSubmissions(auctionId, userId) {
  const auction = await getAuction(auctionId);

  if (auction.directAuction.status !== "SUBMISSION_OPEN") {
    throw fail("There is no open submission window.", 409);
  }

  auction.directAuction.status = "REVIEW";
  auction.updatedBy = userId;

  await auction.save();

  return getDirectSelectionSnapshot(auctionId);
}

/**
 * Organizer manually awards a player to a team.
 */
export async function awardDirectPlayer({
  auctionId,
  playerId,
  teamId,
  userId,
  remarks = "",
}) {
  const auction = await getAuction(auctionId);

  assertCanAward(auction);

  if (!validId(playerId) || !validId(teamId)) {
    throw fail("Invalid player or team ID.");
  }

  const player = await getAvailablePlayer(auction, playerId);
  const team = await Team.findOne({
    _id: teamId,
    organization: auction.organization,
    tournament: auction.tournament,
    approvalStatus: "approved",
  });

  if (!team) {
    throw fail("Approved team not found.", 404);
  }

  const tournament = await getTournament(auction);
  const maxSquadSize = Math.min(13, Number(tournament.squadSize || 13));

  if ((team.squad || []).length >= maxSquadSize) {
    throw fail(
      `This team has reached its maximum squad size of ${maxSquadSize}.`,
      409,
    );
  }

  const matchingBids = auction.directAuction.submissions
    .filter((submission) =>
      submission.bids.some((bid) => sameId(bid.player, playerId)),
    )
    .map((submission) => {
      const bid = submission.bids.find((item) => sameId(item.player, playerId));

      return {
        team: submission.team,
        amount: bid.amount,
      };
    });

  const winningBid = matchingBids.find((bid) => sameId(bid.team, teamId));

  if (!winningBid) {
    throw fail("This team did not submit a bid for this player.", 409);
  }

  const amount = Number(winningBid.amount);

  if (Number(team.purseRemaining || 0) < amount) {
    throw fail("The team's remaining purse is insufficient.", 409);
  }

  if (
    auction.directAuction.awards.some((award) => sameId(award.player, playerId))
  ) {
    throw fail("This player has already been awarded.", 409);
  }

  // Claim player first. This prevents two organizers from awarding
  // the same player simultaneously.
  const claimedPlayer = await Player.findOneAndUpdate(
    {
      _id: playerId,
      tournament: auction.tournament,
      approvalStatus: "approved",
      auctionStatus: "AVAILABLE",
    },
    {
      $set: {
        auctionStatus: "SOLD",
        soldTo: team._id,
        soldPrice: amount,
      },
    },
    { new: true },
  );

  if (!claimedPlayer) {
    throw fail("This player has already been selected.", 409);
  }

  // Atomically enforce the purse and 13-player cap.
  const updatedTeam = await Team.findOneAndUpdate(
    {
      _id: team._id,
      organization: auction.organization,
      tournament: auction.tournament,
      approvalStatus: "approved",
      purseRemaining: { $gte: amount },
      $expr: {
        $lt: [{ $size: { $ifNull: ["$squad", []] } }, maxSquadSize],
      },
    },
    {
      $inc: { purseRemaining: -amount },
      $addToSet: { squad: player._id },
    },
    { new: true },
  );

  if (!updatedTeam) {
    await Player.updateOne(
      {
        _id: player._id,
        auctionStatus: "SOLD",
        soldTo: team._id,
      },
      {
        $set: {
          auctionStatus: "AVAILABLE",
          soldTo: null,
          soldPrice: 0,
        },
      },
    );

    throw fail(
      "Team purse or squad capacity changed. Refresh and try again.",
      409,
    );
  }

  try {
    auction.directAuction.awards.push({
      player: player._id,
      team: team._id,
      amount,
      round: auction.directAuction.currentRound || 1,
      awardedAt: new Date(),
    });

    auction.updatedBy = userId;

    await auction.save();
  } catch (error) {
    // Compensate if the auction record cannot be saved.
    await Team.updateOne(
      { _id: team._id },
      {
        $pull: { squad: player._id },
        $inc: { purseRemaining: amount },
      },
    );

    await Player.updateOne(
      { _id: player._id, soldTo: team._id },
      {
        $set: {
          auctionStatus: "AVAILABLE",
          soldTo: null,
          soldPrice: 0,
        },
      },
    );

    throw error;
  }

  return {
    success: true,
    message: "Player awarded successfully.",
    player: claimedPlayer,
    team: updatedTeam,
    amount,
  };
}

async function syncDirectAuctionSchedule(auction) {
  if (
    auction.auctionFormat !== "DIRECT_SELECTION" ||
    auction.directAuction?.status !== "DRAFT"
  ) {
    return auction;
  }

  const scheduledAt = auction.scheduledAt;

  if (!scheduledAt || new Date(scheduledAt).getTime() > Date.now()) {
    return auction;
  }

  // Atomic transition: only one request needs to open submissions.
  const updated = await Auction.findOneAndUpdate(
    {
      _id: auction._id,
      auctionFormat: "DIRECT_SELECTION",
      "directAuction.status": "DRAFT",
      scheduledAt: { $lte: new Date() },
    },
    {
      $set: {
        "directAuction.status": "SUBMISSION_OPEN",
      },
    },
    { new: true },
  );

  return updated || Auction.findById(auction._id);
}
