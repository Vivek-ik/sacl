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
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/phone and password are required",
      });
    }

    const value = identifier.trim();

    // Check whether identifier is an email or phone number
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    let user;

    if (isEmail) {
      user = await User.findOne({
        email: value.toLowerCase(),
      }).select("+password");
    } else {
      // Normalize phone number by removing spaces and common separators
      const normalizedPhone = value.replace(/[\s()-]/g, "");

      user = await User.findOne({
        phone: normalizedPhone,
      }).select("+password");
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email/phone or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account disabled",
      });
    }

    res.json({
      token: signToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
}
