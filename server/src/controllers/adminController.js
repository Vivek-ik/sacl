import Player from "../models/Player.js";
import Team from "../models/Team.js";

export async function listApplications(req, res, next) {
  try {
    const [players, teams] = await Promise.all([
      Player.find().populate("user", "name email phone").sort({ createdAt: -1 }),
      Team.find().populate("primaryOwner", "name email phone").sort({ createdAt: -1 }),
    ]);
    res.json({ players, teams });
  } catch (e) { next(e); }
}
export async function reviewApplication(req, res, next) {
  try {
    const { entity, id } = req.params;
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    const Model = entity === "players" ? Player : entity === "teams" ? Team : null;
    if (!Model) return res.status(400).json({ message: "Invalid application type" });
    const record = await Model.findByIdAndUpdate(id, { approvalStatus: status }, { new: true });
    if (!record) return res.status(404).json({ message: "Application not found" });
    res.json(record);
  } catch (e) { next(e); }
}
