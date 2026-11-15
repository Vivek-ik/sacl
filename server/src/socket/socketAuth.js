import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function protectSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return next(new Error("Invalid account"));
    socket.user = user;
    next();
  } catch { next(new Error("Invalid or expired token")); }
}
