import mongoose from "mongoose";
const schema = new mongoose.Schema({
  match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true, index: true },
  innings: { type: mongoose.Schema.Types.ObjectId, ref: "Innings", required: true, index: true },
  sequence: { type: Number, required: true },
  overNumber: Number, ballInOver: Number,
  striker: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  bowler: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  batterRuns: { type: Number, default: 0, min: 0, max: 6 },
  extraType: { type: String, enum: ["none","wide","no_ball","bye","leg_bye"], default: "none" },
  extraRuns: { type: Number, default: 0, min: 0 },
  totalRuns: { type: Number, required: true },
  isLegalDelivery: { type: Boolean, required: true },
  wicket: {
    kind: { type: String, enum: ["bowled","caught","lbw","stumped","run_out","hit_wicket","retired_hurt","obstructing_the_field"] },
    batter: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    fielder: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null }
  },
  note: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
schema.index({ innings: 1, sequence: 1 }, { unique: true });
export default mongoose.model("Delivery", schema);
