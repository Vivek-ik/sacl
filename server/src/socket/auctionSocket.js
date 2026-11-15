import { Server } from "socket.io";
import { protectSocket } from "./socketAuth.js";
import {
  placeBid,
  startPlayer,
  closeCurrentPlayer,
  getAuctionSnapshot,
} from "../services/auctionService.js";

export function initializeAuctionSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });
  io.use(protectSocket);
  io.on("connection", async (socket) => {
    socket.join("auction-room");
    socket.emit("auction:state", await getAuctionSnapshot().catch(() => null));

    socket.on("auction:start", async ({ playerId } = {}, ack = () => {}) => {
      try {
        if (!["admin", "auctioneer"].includes(socket.user.role))
          throw Object.assign(new Error("Forbidden"), { status: 403 });
        const state = await startPlayer(playerId, socket.user._id);
        io.to("auction-room").emit("auction:state", state);
        ack({ success: true, state });
      } catch (e) {
        ack({ success: false, message: e.message });
      }
    });

    socket.on(
      "auction:bid",
      async ({ teamId, amount } = {}, ack = () => {}) => {
        try {
          if (socket.user.role !== "team_owner")
            throw Object.assign(new Error("Only team owners can bid"), {
              status: 403,
            });
          const state = await placeBid({
            teamId,
            amount,
            userId: socket.user._id,
          });
          io.to("auction-room").emit("auction:state", state);
          ack({ success: true, state });
        } catch (e) {
          ack({ success: false, message: e.message });
        }
      },
    );

    socket.on("auction:close", async ({ sold } = {}, ack = () => {}) => {
      try {
        if (!["admin", "auctioneer"].includes(socket.user.role))
          throw Object.assign(new Error("Forbidden"), { status: 403 });
        const state = await closeCurrentPlayer(Boolean(sold), socket.user._id);
        io.to("auction-room").emit("auction:state", state);
        ack({ success: true, state });
      } catch (e) {
        ack({ success: false, message: e.message });
      }
    });
  });
  return io;
}
