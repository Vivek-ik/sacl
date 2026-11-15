import mongoose from "mongoose";
const bidSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  amount: { type: Number, required: true },
  placedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });
const auctionSchema = new mongoose.Schema({
  status: { type: String, enum: ["IDLE", "RUNNING", "PAUSED", "COMPLETED"], default: "IDLE" },
  currentPlayer: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null },
  currentBid: { type: Number, default: 0 },
  highestBidTeam: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  bids: [bidSchema],
  endsAt: Date,
  startedAt: Date,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
export default mongoose.model("Auction", auctionSchema);
