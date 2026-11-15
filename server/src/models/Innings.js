import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    number: { type: Number, enum: [1, 2], required: true },
    battingTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    bowlingTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    striker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    nonStriker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    currentBowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    totalRuns: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    legalBalls: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    battingStats: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
        runs: Number,
        balls: Number,
        fours: Number,
        sixes: Number,
        isOut: Boolean,
        dismissal: String,
      },
    ],
    bowlingStats: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
        runsConceded: Number,
        wickets: Number,
        legalBalls: Number,
        wides: Number,
        noBalls: Number,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
schema.index({ match: 1, number: 1 }, { unique: true });
export default mongoose.model("Innings", schema);
