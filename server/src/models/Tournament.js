import mongoose from "mongoose";

const tournamentSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    season: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    format: {
      type: String,
      enum: ["T10", "T20", "ODI", "TEST", "CUSTOM"],
      default: "T20",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    venue: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    teamLimit: {
      type: Number,
      required: true,
      min: 2,
      max: 100,
    },
    squadSize: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      default: 13,
    },
    purseTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 50000,
    },
    status: {
      type: String,
      enum: ["draft", "upcoming", "active", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    auctionStatus: {
      type: String,
      enum: ["pending", "scheduled", "live", "completed"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

tournamentSchema.index(
  { organization: 1, name: 1, season: 1 },
  { unique: true },
);

export default mongoose.model("Tournament", tournamentSchema);
