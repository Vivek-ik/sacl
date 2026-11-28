import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/token.js";

import { sendAccountWelcomeEmail } from "../services/emailService.js";

export async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    const allowedRoles = ["player", "team_owner"];

    const role = allowedRoles.includes(req.body.role)
      ? req.body.role
      : "player";

    if (!name?.trim() || !phone || !password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Name, phone number and password (8+ characters) are required",
      });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/[\s()-]/g, "");

    // Validate Indian mobile number
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit Indian mobile number",
      });
    }

    // Check duplicate mobile number
    const existingPhone = await User.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already registered. Please login.",
        field: "phone",
      });
    }

    // Check duplicate email only when provided
    const normalizedEmail = email?.trim().toLowerCase();

    if (normalizedEmail) {
      const existingEmail = await User.findOne({
        email: normalizedEmail,
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
          field: "email",
        });
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail || undefined,
      phone: normalizedPhone,
      password: await bcrypt.hash(password, 12),
      role,
    });

    if (user.email) {
      sendAccountWelcomeEmail({
        to: user.email,
        name: user.name,
        role: user.role,
      }).catch((error) => {
        console.error("Welcome email failed:", error.message);
      });
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful",
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
    // Handle duplicate-key race conditions
    if (e.code === 11000) {
      const duplicateField = Object.keys(e.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message:
          duplicateField === "phone"
            ? "This mobile number is already registered. Please login."
            : "This email is already registered.",
        field: duplicateField,
      });
    }

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
