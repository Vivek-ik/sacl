import bcrypt from "bcryptjs";
import User from "../models/User.js";

const getAuthenticatedUserId = (req) => req.user?._id || req.user?.id;

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email || "",
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
});

// GET /api/users/profile
export async function getProfile(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);

    const user = await User.findById(userId).select(
      "name email phone role isActive createdAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

// PUT /api/users/profile
export async function updateProfile(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);

    const { name, email, phone } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
    }

    const normalizedPhone = phone.replace(/[\s()-]/g, "");

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    const normalizedEmail = email?.trim().toLowerCase() || "";

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check whether another account already uses this phone.
    const existingPhone = await User.findOne({
      phone: normalizedPhone,
      _id: { $ne: userId },
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "This phone number is already registered.",
        field: "phone",
      });
    }

    // Check duplicate email only when supplied.
    if (normalizedEmail) {
      const existingEmail = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: userId },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "This email address is already registered.",
          field: "email",
        });
      }
    }

    user.name = name.trim();
    user.phone = normalizedPhone;
    user.email = normalizedEmail || undefined;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message:
          field === "phone"
            ? "This phone number is already registered."
            : "This email address is already registered.",
        field,
      });
    }

    next(error);
  }
}

// PATCH /api/users/profile/password
export async function updatePassword(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters.",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
}
