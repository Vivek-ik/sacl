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
          Number(tournament.squadSize || 13),
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

export async function getDirectSelectionSnapshot(auctionId) {
  const auction = await Auction.findById(auctionId)
    .populate("directSelections.team", "name")
    .populate("directSelections.player", "fullName category role photo")
    .populate("directSelections.selectedBy", "name");

  if (!auction) throw fail("Auction not found.", 404);

  return { auction };
}
