import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protectSocket(socket, next) {
  try {
    const token = socket.handshake.auth?.token;

    // Public viewers may connect without a token.
    if (!token) {
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      socket.user = null;
      return next();
    }

    socket.user = user;
    return next();
  } catch (error) {
    // A stale token should not prevent someone from watching publicly.
    // Management actions still require a valid authenticated user.
    socket.user = null;
    return next();
  }
}
