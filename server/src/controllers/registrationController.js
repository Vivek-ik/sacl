import Player from "../models/Player.js";
import Team from "../models/Team.js";
import { AUCTION_RULES } from "../config/auctionRules.js";

export async function registerPlayer(req, res, next) {
  try {
    const exists = await Player.findOne({ user: req.user._id });
    if (exists)
      return res.status(409).json({ message: "Player profile already exists" });
    const team = await Team.findOne({
      _id: req.body.preferredTeamId,
      approvalStatus: "approved",
    });

    if (!team) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid approved team",
      });
    }

    const player = await Player.create({
      fullName: req.body.fullName,
      category: req.body.category,
      role: req.body.role,
      battingStyle: req.body.battingStyle,
      bowlingStyle: req.body.bowlingStyle,
      preferredJerseyNumber: req.body.preferredJerseyNumber,
      preferredTeam: team._id,
      user: req.user.id,
    });
    res.status(201).json(player);
  } catch (e) {
    next(e);
  }
}
export async function registerTeam(req, res, next) {
  try {
    if (await Team.findOne({ primaryOwner: req.user._id }))
      return res.status(409).json({ message: "You already registered a team" });
    const team = await Team.create({
      owner: req.user.id,
      ...req.body,
      primaryOwner: req.user._id,
      purseTotal: AUCTION_RULES.teamPurse,
      purseRemaining: AUCTION_RULES.teamPurse,
    });
    res.status(201).json(team);
  } catch (e) {
    next(e);
  }
}
export async function myRegistration(req, res, next) {
  try {
    const [player, team] = await Promise.all([
      Player.findOne({
        user: req.user.id,
      }).populate("preferredTeam", "name"),
      Team.findOne({ primaryOwner: req.user._id }).populate(
        "squad",
        "fullName category role",
      ),
    ]);
    res.json({ player, team });
  } catch (e) {
    next(e);
  }
}
