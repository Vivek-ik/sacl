import mongoose from "mongoose";
const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: false, trim: true, unique: true },
    logo: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    primaryOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coOwnerName: String,
    coOwnerPhone: String,
    registrationFeeStatus: {
      type: String,
      enum: ["pending", "paid", "waived"],
      default: "pending",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    purseTotal: { type: Number, default: 50000 },
    purseRemaining: { type: Number, default: 50000 },
    squad: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true },
);

teamSchema.index({ organization: 1, tournament: 1, name: 1 }, { unique: true });

const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);

export default Team;
