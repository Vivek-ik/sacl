import { Server } from "socket.io";
import { protectSocket } from "./socketAuth.js";
import {
  placeBid,
  startPlayer,
  closeCurrentPlayer,
  getAuctionSnapshot,
  advanceExpiredAuction,
} from "../services/auctionService.js";

export function initializeAuctionSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  let advancingAuction = false;

  const auctionTimer = setInterval(async () => {
    if (advancingAuction) return;

    try {
      advancingAuction = true;

      const before = await getAuctionSnapshot();

      if (
        before?.status === "RUNNING" &&
        before?.endsAt &&
        new Date(before.endsAt).getTime() <= Date.now()
      ) {
        const updatedState = await advanceExpiredAuction();

        io.to("auction-room").emit("auction:state", updatedState);
        io.to("auction-room").emit("auction:notice", {
          message: updatedState?.currentPlayer
            ? "Time expired. Moving to the next player."
            : "Auction lot closed. No more available players.",
        });
      }
    } catch (error) {
      console.error("Auction timer error:", error);
    } finally {
      advancingAuction = false;
    }
  }, 500);
  
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
