import mongoose from "mongoose";
const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  teamAPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  teamBPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  oversPerInnings: { type: Number, required: true, min: 1, max: 50 },
  ballsPerOver: { type: Number, default: 6, immutable: true },
  scorer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["scheduled","live","completed","abandoned"], default: "scheduled", index: true },
  currentInnings: { type: Number, enum: [1,2], default: 1 },
  result: { type: String, default: "" },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  startedAt: Date, completedAt: Date
}, { timestamps: true });
export default mongoose.model("Match", schema);
