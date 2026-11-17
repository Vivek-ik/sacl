import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true, unique: true },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },

    role: {
      type: String,
      enum: [
        "super_admin",
        "org_admin",
        "admin", // Temporary compatibility for existing records
        "auctioneer",
        "scorer",
        "team_owner",
        "player",
      ],
      default: "player",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);
export default mongoose.model("User", userSchema);
