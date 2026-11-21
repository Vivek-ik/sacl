import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    placedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const auctionSchema = new mongoose.Schema(
  {
    // Organization and tournament scope
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },

    // Auction management
    auctionName: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAuctioneers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    scheduledAt: {
      type: Date,
      default: null,
    },
    timerSeconds: {
      type: Number,
      default: 45,
      min: 5,
      max: 300,
    },
    minimumReservePerSlot: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Live auction state
    status: {
      type: String,
      enum: ["IDLE", "RUNNING", "PAUSED", "COMPLETED"],
      default: "IDLE",
      index: true,
    },
    currentPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    highestBidTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    pausedRemainingMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    bids: [bidSchema],
    endsAt: Date,
    startedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

auctionSchema.index({ organization: 1, tournament: 1 }, { unique: true });

export default mongoose.models.Auction ||
  mongoose.model("Auction", auctionSchema);
