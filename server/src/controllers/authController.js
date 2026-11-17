import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";

export async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;
    const allowedRoles = ["player", "team_owner"];

    const role = allowedRoles.includes(req.body.role)
      ? req.body.role
      : "player";

    if (!name || !email || !password || password.length < 8)
      return res.status(400).json({
        message: "Name, valid email and password (8+ characters) are required",
      });
    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 12),
      role,
    });
    res.status(201).json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    console.log("email, password",email, password);
    
    const user = await User.findOne({ email }).select("+password");
    console.log("user",user);
    
    if (!user || !(await bcrypt.compare(password || "", user.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    if (!user.isActive)
      return res.status(403).json({ message: "Account disabled" });
    res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
}
