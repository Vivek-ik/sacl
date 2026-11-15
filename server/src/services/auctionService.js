import Auction from "../models/Auction.js";
import Player from "../models/Player.js";
import Team from "../models/Team.js";
import { AUCTION_RULES } from "../config/auctionRules.js";

export async function getOrCreateAuction() {
  let auction = await Auction.findOne().sort({ createdAt: -1 });
  if (!auction) auction = await Auction.create({});
  return auction;
}
export async function startPlayer(playerId, userId) {
  const player = await Player.findOne({
    _id: playerId,
    approvalStatus: "approved",
    auctionStatus: "AVAILABLE",
  });
  if (!player)
    throw Object.assign(new Error("Approved available player not found"), {
      status: 404,
    });
  const auction = await getOrCreateAuction();
  if (auction.status === "RUNNING")
    throw Object.assign(new Error("An auction is already running"), {
      status: 409,
    });
  player.auctionStatus = "IN_AUCTION";
  await player.save();
  auction.status = "RUNNING";
  auction.currentPlayer = player._id;
  auction.currentBid = 0;
  auction.highestBidTeam = null;
  auction.bids = [];
  auction.startedAt = new Date();
  auction.endsAt = new Date(Date.now() + AUCTION_RULES.timerSeconds * 1000);
  auction.updatedBy = userId;
  await auction.save();
  return auction.populate("currentPlayer");
}
export async function placeBid({ teamId, amount, userId }) {
  const auction = await getOrCreateAuction();
  if (auction.status !== "RUNNING" || !auction.currentPlayer)
    throw Object.assign(new Error("No active auction"), { status: 409 });
  if (!auction.endsAt || auction.endsAt.getTime() <= Date.now())
    throw Object.assign(new Error("Bidding timer has expired"), {
      status: 409,
    });
  const team = await Team.findOne({
    _id: teamId,
    primaryOwner: userId,
    approvalStatus: "approved",
  });
  if (!team)
    throw Object.assign(new Error("Approved team not found for this account"), {
      status: 403,
    });
  const player = await Player.findById(auction.currentPlayer);
  if (team.squad.length >= AUCTION_RULES.squadSize)
    throw Object.assign(new Error("Squad is full"), { status: 409 });
  if (
    player.category === "ICONIC" &&
    (await Player.countDocuments({ soldTo: team._id, category: "ICONIC" })) >=
      AUCTION_RULES.iconicLimit
  )
    throw Object.assign(new Error("Iconic player limit reached"), {
      status: 409,
    });
  const maxBid = AUCTION_RULES.categoryMax[player.category];
  const nextBid = Number(amount);
  if (
    !Number.isInteger(nextBid) ||
    nextBid <= auction.currentBid ||
    nextBid > maxBid
  )
    throw Object.assign(
      new Error(
        `Bid must be a whole number, higher than current bid and no more than ${maxBid}`,
      ),
      { status: 400 },
    );
  const slotsAfterPurchase = AUCTION_RULES.squadSize - (team.squad.length + 1);
  const reserve = slotsAfterPurchase * AUCTION_RULES.minimumReservePerSlot;
  if (team.purseRemaining - nextBid < reserve)
    throw Object.assign(
      new Error(
        "Bid would violate the minimum reserve for remaining squad slots",
      ),
      { status: 409 },
    );
  auction.currentBid = nextBid;
  auction.highestBidTeam = team._id;
  auction.bids.push({ team: team._id, amount: nextBid, placedBy: userId });
  auction.endsAt = new Date(Date.now() + AUCTION_RULES.timerSeconds * 1000);
  await auction.save();
  return getAuctionSnapshot();
}
export async function closeCurrentPlayer(sold, userId) {
  const auction = await getOrCreateAuction();
  if (auction.status !== "RUNNING" || !auction.currentPlayer)
    throw Object.assign(new Error("No active player"), { status: 409 });
  const player = await Player.findById(auction.currentPlayer);
  if (sold && auction.highestBidTeam) {
    const team = await Team.findById(auction.highestBidTeam);
    if (!team) throw new Error("Winning team missing");
    if (
      team.squad.length >= AUCTION_RULES.squadSize ||
      team.purseRemaining < auction.currentBid
    )
      throw Object.assign(
        new Error("Team no longer meets auction constraints"),
        { status: 409 },
      );
    team.purseRemaining -= auction.currentBid;
    team.squad.push(player._id);
    await team.save();
    player.auctionStatus = "SOLD";
    player.soldTo = team._id;
    player.soldPrice = auction.currentBid;
  } else {
    player.auctionStatus = "UNSOLD";
  }
  await player.save();
  auction.status = "IDLE";
  auction.currentPlayer = null;
  auction.currentBid = 0;
  auction.highestBidTeam = null;
  auction.bids = [];
  auction.endsAt = null;
  auction.updatedBy = userId;
  await auction.save();
  return getAuctionSnapshot();
}
export async function getAuctionSnapshot() {
  const auction = await getOrCreateAuction();
  return auction.populate([
    { path: "currentPlayer" },
    { path: "highestBidTeam", select: "name purseRemaining" },
    { path: "bids.team", select: "name" },
  ]);
}
