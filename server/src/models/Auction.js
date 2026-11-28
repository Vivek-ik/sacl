import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    amount: { type: Number, required: true },
    placedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const draftPickSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true },
    pickNumber: { type: Number, required: true },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    pickedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pickedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const directSelectionSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    selectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    selectedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const directBidSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const directSubmissionSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    bids: {
      type: [directBidSchema],
      default: [],
    },
  },
  { _id: false },
);

const directAwardSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    awardedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const directTieSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    eligibleTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    bids: [
      {
        team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
        amount: { type: Number, required: true },
      },
    ],
    resolvedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    resolvedAmount: {
      type: Number,
      default: null,
    },
  },
  { _id: false },
);

const categoryBidLimitSchema = new mongoose.Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const playerBidLimitSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const auctionSchema = new mongoose.Schema(
  {
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

    auctionName: { type: String, trim: true, default: "" },

    auctionFormat: {
      type: String,
      enum: ["LIVE_BIDDING", "SNAKE_DRAFT", "DIRECT_SELECTION"],
      default: "LIVE_BIDDING",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedAuctioneers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],

    scheduledAt: { type: Date, default: null },
    timerSeconds: { type: Number, default: 45, min: 5, max: 300 },
    minimumReservePerSlot: { type: Number, default: 0, min: 0 },

    selectionPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Snake Draft state
    draft: {
      initialized: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
      teamOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
      currentIndex: { type: Number, default: 0 },
      currentRound: { type: Number, default: 1 },
      pickNumber: { type: Number, default: 0 },
      picks: { type: [draftPickSchema], default: [] },
    },

    directAuction: {
      status: {
        type: String,
        enum: ["DRAFT", "SUBMISSION_OPEN", "REVIEW", "TIE_BREAK", "COMPLETED"],
        default: "DRAFT",
      },

      currentRound: {
        type: Number,
        default: 1,
      },

      submissionDeadline: {
        type: Date,
        default: null,
      },

      submissions: {
        type: [directSubmissionSchema],
        default: [],
      },

      ties: {
        type: [directTieSchema],
        default: [],
      },

      awards: {
        type: [directAwardSchema],
        default: [],
      },

      categoryLimits: {
        type: Map,
        of: categoryBidLimitSchema,
        default: () => ({
          ICONIC: { min: 5000, max: 15000 },
          A: { min: 3000, max: 10000 },
          B: { min: 2000, max: 7000 },
          C: { min: 1000, max: 5000 },
          D: { min: 500, max: 3000 },
        }),
      },

      playerBidLimits: {
        type: [playerBidLimitSchema],
        default: [],
      },
    },

    // Direct Selection history
    directSelections: {
      type: [directSelectionSchema],
      default: [],
    },

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
    currentBid: { type: Number, default: 0 },
    highestBidTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    pausedRemainingMs: { type: Number, default: 0, min: 0 },
    bids: { type: [bidSchema], default: [] },
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
