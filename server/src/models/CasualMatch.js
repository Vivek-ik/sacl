import mongoose from "mongoose";

const playerSnapshotSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const teamSnapshotSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CasualTeam",
      required: true,
    },
    name: { type: String, required: true },
    players: { type: [playerSnapshotSchema], default: [] },
  },
  { _id: false },
);

const batterStatsSchema = new mongoose.Schema(
  {
    playerId: mongoose.Schema.Types.ObjectId,
    name: String,
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    isOut: { type: Boolean, default: false },
    dismissal: { type: String, default: "" },
  },
  { _id: false },
);

const bowlerStatsSchema = new mongoose.Schema(
  {
    playerId: mongoose.Schema.Types.ObjectId,
    name: String,
    legalBalls: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
  },
  { _id: false },
);

const ballSchema = new mongoose.Schema(
  {
    sequence: Number,

    strikerId: mongoose.Schema.Types.ObjectId,
    nonStrikerId: mongoose.Schema.Types.ObjectId,
    bowlerId: mongoose.Schema.Types.ObjectId,

    runs: { type: Number, default: 0 },
    extraType: {
      type: String,
      enum: ["none", "wide", "no_ball", "bye", "leg_bye"],
      default: "none",
    },
    extraRuns: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },

    legal: { type: Boolean, default: true },
    wicket: { type: Boolean, default: false },
    dismissedPlayerId: mongoose.Schema.Types.ObjectId,
    incomingPlayerId: mongoose.Schema.Types.ObjectId,
    dismissal: { type: String, default: "" },

    strikerAfterId: mongoose.Schema.Types.ObjectId,
    nonStrikerAfterId: mongoose.Schema.Types.ObjectId,

    note: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const inningsSchema = new mongoose.Schema(
  {
    number: { type: Number, enum: [1, 2], required: true },
    battingTeamIndex: { type: Number, enum: [0, 1], required: true },

    openingStrikerId: mongoose.Schema.Types.ObjectId,
    openingNonStrikerId: mongoose.Schema.Types.ObjectId,
    openingBowlerId: mongoose.Schema.Types.ObjectId,

    strikerId: mongoose.Schema.Types.ObjectId,
    nonStrikerId: mongoose.Schema.Types.ObjectId,
    bowlerId: mongoose.Schema.Types.ObjectId,

    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    legalBalls: { type: Number, default: 0 },

    battingStats: { type: [batterStatsSchema], default: [] },
    bowlingStats: { type: [bowlerStatsSchema], default: [] },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    events: { type: [ballSchema], default: [] },
  },
  { _id: true },
);

const casualMatchSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 100, default: "" },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    teamA: { type: teamSnapshotSchema, required: true },
    teamB: { type: teamSnapshotSchema, required: true },

    oversPerInnings: { type: Number, default: 5, min: 1, max: 50 },
    venue: { type: String, trim: true, maxlength: 120, default: "" },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "abandoned"],
      default: "scheduled",
      index: true,
    },

    currentInnings: { type: Number, default: 0 },
    innings: { type: [inningsSchema], default: [] },

    result: { type: String, default: "" },
    winnerIndex: {
      type: Number,
      enum: [0, 1, null],
      default: null,
    },

    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

casualMatchSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model("CasualMatch", casualMatchSchema);
