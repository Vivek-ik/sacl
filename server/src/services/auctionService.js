import mongoose from "mongoose";
import Auction from "../models/Auction.js";
import Player from "../models/Player.js";
import Team from "../models/Team.js";
import { AUCTION_RULES } from "../config/auctionRules.js";

const getError = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const getTimerSeconds = (auction) =>
  Number(auction.timerSeconds || AUCTION_RULES.timerSeconds || 45);

const getMinimumReserve = (auction) =>
  Number(
    auction.minimumReservePerSlot ?? AUCTION_RULES.minimumReservePerSlot ?? 0,
  );

function validateId(id, label) {
  if (!mongoose.isValidObjectId(id)) {
    throw getError(`Invalid ${label}`, 400);
  }
}

// Always retrieve a specific auction.
async function findAuction(auctionId) {
  validateId(auctionId, "auction ID");

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw getError("Auction not found", 404);
  }

  return auction;
}

// Return the populated state for one auction.
export async function getAuctionSnapshot(auctionId) {
  const auction = await findAuction(auctionId);

  await auction.populate([
    { path: "currentPlayer" },
    { path: "highestBidTeam", select: "name purseRemaining" },
    { path: "bids.team", select: "name" },
  ]);

  return auction;
}

// Manually start a player.
export async function startPlayer(auctionId, playerId, userId) {
  validateId(playerId, "player ID");

  const auction = await findAuction(auctionId);

  if (!["IDLE"].includes(auction.status)) {
    throw getError(
      "Close the current player before starting another player.",
      409,
    );
  }

  if (
    auction.scheduledAt &&
    new Date(auction.scheduledAt).getTime() > Date.now()
  ) {
    throw getError(
      `Auction is scheduled for ${new Date(auction.scheduledAt).toLocaleString(
        "en-IN",
      )}. You cannot start it yet.`,
      409,
    );
  }

  const player = await Player.findOne({
    _id: playerId,
    tournament: auction.tournament,
    approvalStatus: "approved",
    auctionStatus: "AVAILABLE",
  });

  if (!player) {
    throw getError(
      "Approved available player not found in this tournament.",
      404,
    );
  }

  player.auctionStatus = "IN_AUCTION";
  await player.save();

  auction.status = "RUNNING";
  auction.currentPlayer = player._id;
  auction.currentBid = 0;
  auction.highestBidTeam = null;
  auction.bids = [];
  auction.pausedRemainingMs = 0;
  auction.startedAt = new Date();
  auction.endsAt = new Date(Date.now() + getTimerSeconds(auction) * 1000);
  auction.updatedBy = userId;

  await auction.save();

  return getAuctionSnapshot(auctionId);
}

// Place a bid and reset the timer after every accepted bid.
export async function placeBid({ auctionId, teamId, amount, userId }) {
  validateId(teamId, "team ID");

  const auction = await findAuction(auctionId);

  if (auction.status !== "RUNNING" || !auction.currentPlayer) {
    throw getError("Bidding is not currently active.", 409);
  }

  const now = new Date();

  if (!auction.endsAt || auction.endsAt.getTime() <= now.getTime()) {
    throw getError("Bidding timer has expired.", 409);
  }

  const [team, player] = await Promise.all([
    Team.findOne({
      _id: teamId,
      tournament: auction.tournament,
      organization: auction.organization,
      primaryOwner: userId,
      approvalStatus: "approved",
    }),
    Player.findOne({
      _id: auction.currentPlayer,
      tournament: auction.tournament,
      auctionStatus: "IN_AUCTION",
      approvalStatus: "approved",
    }),
  ]);

  if (!team) {
    throw getError(
      "Approved team not found for this account and tournament.",
      403,
    );
  }

  if (!player) {
    throw getError("Current auction player not found.", 404);
  }

  const squad = team.squad || [];

  if (squad.length >= AUCTION_RULES.squadSize) {
    throw getError("Squad is full.", 409);
  }

  if (
    player.category === "ICONIC" &&
    (await Player.countDocuments({
      soldTo: team._id,
      category: "ICONIC",
      auctionStatus: "SOLD",
    })) >= AUCTION_RULES.iconicLimit
  ) {
    throw getError("Iconic player limit reached.", 409);
  }

  const nextBid = Number(amount);
  const currentBid = Number(auction.currentBid || 0);
  const maxBid = AUCTION_RULES.categoryMax[player.category];

  if (
    !Number.isInteger(nextBid) ||
    nextBid <= currentBid ||
    (maxBid != null && nextBid > maxBid)
  ) {
    throw getError(
      `Bid must be a whole number, higher than the current bid${
        maxBid != null ? ` and no more than ${maxBid}` : ""
      }.`,
      400,
    );
  }

  const purseRemaining = Number(team.purseRemaining || 0);

  if (nextBid > purseRemaining) {
    throw getError("Insufficient team purse.", 409);
  }

  const slotsAfterPurchase = AUCTION_RULES.squadSize - (squad.length + 1);

  const reserve = slotsAfterPurchase * getMinimumReserve(auction);

  if (purseRemaining - nextBid < reserve) {
    throw getError(
      "Bid would violate the minimum reserve for remaining squad slots.",
      409,
    );
  }

  const newEndsAt = new Date(Date.now() + getTimerSeconds(auction) * 1000);

  // Atomic condition prevents two competing bids from overwriting
  // each other when they arrive almost simultaneously.
  const updatedAuction = await Auction.findOneAndUpdate(
    {
      _id: auctionId,
      status: "RUNNING",
      currentPlayer: player._id,
      currentBid: auction.currentBid,
      endsAt: { $gt: new Date() },
    },
    {
      $set: {
        currentBid: nextBid,
        highestBidTeam: team._id,
        endsAt: newEndsAt,
        updatedBy: userId,
      },
      $push: {
        bids: {
          team: team._id,
          amount: nextBid,
          placedBy: userId,
          createdAt: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!updatedAuction) {
    throw getError(
      "Another bid was placed or the timer expired. Refresh and try again.",
      409,
    );
  }

  return getAuctionSnapshot(auctionId);
}

// Manually mark the current player Sold or Unsold.
export async function closeCurrentPlayer(auctionId, sold, userId) {
  const auction = await findAuction(auctionId);

  if (
    !["RUNNING", "PAUSED"].includes(auction.status) ||
    !auction.currentPlayer
  ) {
    throw getError("No active player to close.", 409);
  }

  const player = await Player.findOne({
    _id: auction.currentPlayer,
    tournament: auction.tournament,
  });

  if (!player) {
    throw getError("Current player not found.", 404);
  }

  if (sold && !auction.highestBidTeam) {
    throw getError(
      "This player has no bids. Mark the player Unsold instead.",
      409,
    );
  }

  if (sold) {
    const team = await Team.findOne({
      _id: auction.highestBidTeam,
      tournament: auction.tournament,
      organization: auction.organization,
      approvalStatus: "approved",
    });

    if (!team) {
      throw getError("Winning team not found.", 404);
    }

    const squad = team.squad || [];

    if (
      squad.length >= AUCTION_RULES.squadSize ||
      Number(team.purseRemaining || 0) < Number(auction.currentBid)
    ) {
      throw getError("Winning team no longer meets auction constraints.", 409);
    }

    if (
      player.category === "ICONIC" &&
      (await Player.countDocuments({
        soldTo: team._id,
        category: "ICONIC",
        auctionStatus: "SOLD",
      })) >= AUCTION_RULES.iconicLimit
    ) {
      throw getError("Winning team has reached the Iconic player limit.", 409);
    }

    team.purseRemaining =
      Number(team.purseRemaining || 0) - Number(auction.currentBid);

    team.squad.push(player._id);

    await team.save();

    player.auctionStatus = "SOLD";
    player.soldTo = team._id;
    player.soldPrice = auction.currentBid;
  } else {
    player.auctionStatus = "UNSOLD";
    player.soldTo = null;
    player.soldPrice = null;
  }

  await player.save();

  // Reset the lot. The auctioneer must manually select the next player.
  auction.status = "IDLE";
  auction.currentPlayer = null;
  auction.currentBid = 0;
  auction.highestBidTeam = null;
  auction.bids = [];
  auction.endsAt = null;
  auction.pausedRemainingMs = 0;
  auction.updatedBy = userId;

  await auction.save();
  return getAuctionSnapshot(auctionId);
}

// Called by the socket timer.
// Expiry pauses bidding but does not sell or advance the player.
export async function advanceExpiredAuction(auctionId) {
  const auction = await findAuction(auctionId);

  if (
    auction.status !== "RUNNING" ||
    !auction.currentPlayer ||
    !auction.endsAt
  ) {
    return getAuctionSnapshot(auctionId);
  }

  if (auction.endsAt.getTime() > Date.now()) {
    return getAuctionSnapshot(auctionId);
  }

  // Conditional update protects against a bid arriving at expiry.
  await Auction.updateOne(
    {
      _id: auctionId,
      status: "RUNNING",
      currentPlayer: auction.currentPlayer,
      endsAt: { $lte: new Date() },
    },
    {
      $set: {
        status: "PAUSED",
        endsAt: null,
      },
    },
  );

  return getAuctionSnapshot(auctionId);
}

export async function pauseAuction(auctionId, userId) {
  const auction = await findAuction(auctionId);

  if (
    auction.status !== "RUNNING" ||
    !auction.currentPlayer ||
    !auction.endsAt
  ) {
    throw getError("There is no running player auction to pause.", 409);
  }

  const now = new Date();
  const remainingMs = auction.endsAt.getTime() - now.getTime();

  if (remainingMs <= 0) {
    throw getError("The bidding timer has already expired.", 409);
  }

  const updated = await Auction.findOneAndUpdate(
    {
      _id: auctionId,
      status: "RUNNING",
      currentPlayer: auction.currentPlayer,
      currentBid: auction.currentBid,
      endsAt: auction.endsAt,
    },
    {
      $set: {
        status: "PAUSED",
        endsAt: null,
        pausedRemainingMs: remainingMs,
        updatedBy: userId,
      },
    },
    { new: true },
  );

  if (!updated) {
    throw getError("Auction changed. Refresh and try again.", 409);
  }

  return getAuctionSnapshot(auctionId);
}

export async function resumeAuction(auctionId, userId) {
  const auction = await findAuction(auctionId);

  if (auction.status !== "PAUSED" || !auction.currentPlayer) {
    throw getError("There is no paused player auction to resume.", 409);
  }

  const remainingMs = Number(auction.pausedRemainingMs || 0);

  if (remainingMs <= 0) {
    throw getError(
      "The bidding timer has expired. Mark this player Sold or Unsold.",
      409,
    );
  }

  const now = new Date();
  const newEndsAt = new Date(now.getTime() + remainingMs);

  const updated = await Auction.findOneAndUpdate(
    {
      _id: auctionId,
      status: "PAUSED",
      currentPlayer: auction.currentPlayer,
      pausedRemainingMs: remainingMs,
    },
    {
      $set: {
        status: "RUNNING",
        endsAt: newEndsAt,
        pausedRemainingMs: 0,
        updatedBy: userId,
      },
    },
    { new: true },
  );

  if (!updated) {
    throw getError("Auction changed. Refresh and try again.", 409);
  }

  return getAuctionSnapshot(auctionId);
}
