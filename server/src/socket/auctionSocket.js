import { Server } from "socket.io";
import mongoose from "mongoose";
import { protectSocket } from "./socketAuth.js";

import Auction from "../models/Auction.js";
import Team from "../models/Team.js";

import {
  placeBid,
  startPlayer,
  closeCurrentPlayer,
  getAuctionSnapshot,
  pauseAuction,
  resumeAuction,
} from "../services/auctionService.js";

const auctionRoom = (auctionId) => `auction:${String(auctionId)}`;

const getUserId = (user) => user?._id || user?.id;

const getError = (message, status = 400) =>
  Object.assign(new Error(message), { status });

const canManageAuction = (user, auction) => {
  if (!user || !auction) return false;

  const userId = getUserId(user);

  if (user.role === "super_admin") {
    return true;
  }

  if (["org_admin", "admin"].includes(user.role)) {
    return String(user.organization) === String(auction.organization);
  }

  if (user.role === "auctioneer") {
    return (auction.assignedAuctioneers || []).some(
      (id) => String(id?._id || id) === String(userId),
    );
  }

  return false;
};

/**
 * Check whether the connected user can access this auction.
 *
 * Managers:
 * - super_admin: all auctions
 * - org_admin/admin: auctions belonging to their organization
 * - auctioneer: only assigned auctions
 *
 * Team owner:
 * - Must own an approved team in the same organization
 *   and tournament.
 */
async function getAccessibleAuction(auctionId, user) {
  if (!mongoose.isValidObjectId(auctionId)) {
    throw getError("Invalid auction ID.", 400);
  }

  if (!user || !getUserId(user)) {
    throw getError("Authentication required.", 401);
  }

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    throw getError("Auction not found.", 404);
  }

  if (canManageAuction(user, auction)) {
    return auction;
  }

  if (user.role === "team_owner") {
    const ownsApprovedTeam = await Team.exists({
      organization: auction.organization,
      tournament: auction.tournament,
      primaryOwner: getUserId(user),
      approvalStatus: "approved",
    });

    if (ownsApprovedTeam) {
      return auction;
    }
  }

  throw getError("You cannot access this auction.", 403);
}

/**
 * Only managers and assigned auctioneers can perform
 * auction management operations.
 */
function requireAuctionManager(user, auction) {
  if (!canManageAuction(user, auction)) {
    throw getError(
      "Only an organization admin or assigned auctioneer can perform this action.",
      403,
    );
  }
}

/**
 * Standard acknowledgement response.
 */
function acknowledgeError(ack, error) {
  ack({
    success: false,
    message: error?.message || "Something went wrong.",
    status: error?.status || 500,
  });
}

/**
 * Emit the latest auction state to everyone in this auction room.
 */
async function broadcastAuctionState(io, auctionId) {
  const state = await getAuctionSnapshot(auctionId);

  io.to(auctionRoom(auctionId)).emit("auction:state", state);

  return state;
}

export function initializeAuctionSocket(httpServer) {
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
    : ["http://localhost:5173"];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Every socket must be authenticated.
  io.use(protectSocket);

  // Prevent duplicate expiry processing inside this Node.js process.
  const processingAuctions = new Set();

  /**
   * Auction expiry worker.
   *
   * Expiry only changes RUNNING -> PAUSED.
   * It does not sell the player, mark the player unsold,
   * deduct purse, or select another player.
   */
  const auctionTimer = setInterval(async () => {
    try {
      const now = new Date();

      const expiredAuctions = await Auction.find({
        status: "RUNNING",
        endsAt: { $lte: now },
        currentPlayer: { $ne: null },
      })
        .select("_id")
        .lean();

      for (const item of expiredAuctions) {
        const auctionId = String(item._id);

        if (processingAuctions.has(auctionId)) {
          continue;
        }

        processingAuctions.add(auctionId);

        try {
          // Atomic update: only one worker can expire this auction.
          const result = await Auction.updateOne(
            {
              _id: auctionId,
              status: "RUNNING",
              endsAt: { $lte: new Date() },
              currentPlayer: { $ne: null },
            },
            {
              $set: {
                status: "PAUSED",
                endsAt: null,
                pausedRemainingMs: 0,
              },
            },
          );

          // Emit only if this process actually changed the status.
          if (result.modifiedCount > 0) {
            const state = await getAuctionSnapshot(auctionId);

            io.to(auctionRoom(auctionId)).emit("auction:state", state);

            io.to(auctionRoom(auctionId)).emit("auction:notice", {
              message:
                "Bidding time expired. The auctioneer must manually mark this player Sold or Unsold.",
            });
          }
        } catch (error) {
          console.error(`Auction expiry error (${auctionId}):`, error);
        } finally {
          processingAuctions.delete(auctionId);
        }
      }
    } catch (error) {
      console.error("Auction timer error:", error);
    }
  }, 500);

  io.on("connection", (socket) => {
    console.log("Auction socket connected:", socket.id);

    /**
     * JOIN AUCTION
     *
     * Client must provide auctionId.
     * A user can only join auctions they are authorized to view.
     */
    socket.on("auction:join", async ({ auctionId } = {}, ack = () => {}) => {
      try {
        if (!mongoose.isValidObjectId(auctionId)) {
          throw getError("Invalid auction ID.", 400);
        }

        const auction = await Auction.findById(auctionId);

        if (!auction) {
          throw getError("Auction not found.", 404);
        }

        // Authenticated users can join the public read-only room.
        // Anonymous users can also join, but cannot perform any actions.
        const room = auctionRoom(auctionId);

        // Leave any previously joined auction room.
        for (const joinedRoom of socket.rooms) {
          if (joinedRoom.startsWith("auction:")) {
            socket.leave(joinedRoom);
          }
        }

        socket.join(room);

        const state = await getAuctionSnapshot(auctionId);

        socket.emit("auction:state", state);

        ack({
          success: true,
          state,
        });
      } catch (error) {
        acknowledgeError(ack, error);
      }
    });

    /**
     * LEAVE AUCTION
     */
    socket.on("auction:leave", ({ auctionId } = {}, ack = () => {}) => {
      if (auctionId && mongoose.isValidObjectId(auctionId)) {
        socket.leave(auctionRoom(auctionId));
      }

      ack({ success: true });
    });

    /**
     * START PLAYER
     *
     * Only an auction manager or assigned auctioneer can
     * manually start a player.
     */
    socket.on(
      "auction:start",
      async ({ auctionId, playerId } = {}, ack = () => {}) => {
        try {
          const auction = await getAccessibleAuction(auctionId, socket.user);

          requireAuctionManager(socket.user, auction);

          if (!mongoose.isValidObjectId(playerId)) {
            throw getError("Invalid player ID.", 400);
          }

          const state = await startPlayer(
            auctionId,
            playerId,
            getUserId(socket.user),
          );

          io.to(auctionRoom(auctionId)).emit("auction:state", state);

          io.to(auctionRoom(auctionId)).emit("auction:notice", {
            message: "A new player has entered the auction.",
          });

          ack({
            success: true,
            state,
          });
        } catch (error) {
          acknowledgeError(ack, error);
        }
      },
    );

    /**
     * PLACE BID
     *
     * Only team owners can bid.
     * The service also validates that the submitted team
     * belongs to this user and this auction's tournament.
     */
    socket.on(
      "auction:bid",
      async ({ auctionId, teamId, amount } = {}, ack = () => {}) => {
        try {
          if (socket.user?.role !== "team_owner") {
            throw getError("Only team owners can place bids.", 403);
          }

          await getAccessibleAuction(auctionId, socket.user);

          if (!mongoose.isValidObjectId(teamId)) {
            throw getError("Invalid team ID.", 400);
          }

          const state = await placeBid({
            auctionId,
            teamId,
            amount,
            userId: getUserId(socket.user),
          });

          io.to(auctionRoom(auctionId)).emit("auction:state", state);

          io.to(auctionRoom(auctionId)).emit("auction:notice", {
            message: "A new bid has been placed.",
          });

          ack({
            success: true,
            state,
          });
        } catch (error) {
          acknowledgeError(ack, error);
        }
      },
    );

    /**
     * PAUSE AUCTION
     *
     * Freezes the remaining time.
     * Does not reset the timer.
     */
    socket.on("auction:pause", async ({ auctionId } = {}, ack = () => {}) => {
      try {
        const auction = await getAccessibleAuction(auctionId, socket.user);

        requireAuctionManager(socket.user, auction);

        const state = await pauseAuction(auctionId, getUserId(socket.user));

        io.to(auctionRoom(auctionId)).emit("auction:state", state);

        io.to(auctionRoom(auctionId)).emit("auction:notice", {
          message: "Auction paused.",
        });

        ack({
          success: true,
          state,
        });
      } catch (error) {
        acknowledgeError(ack, error);
      }
    });

    /**
     * RESUME AUCTION
     *
     * Continues from pausedRemainingMs.
     * If the timer expired, the service rejects resume.
     */
    socket.on("auction:resume", async ({ auctionId } = {}, ack = () => {}) => {
      try {
        const auction = await getAccessibleAuction(auctionId, socket.user);

        requireAuctionManager(socket.user, auction);

        const state = await resumeAuction(auctionId, getUserId(socket.user));

        io.to(auctionRoom(auctionId)).emit("auction:state", state);

        io.to(auctionRoom(auctionId)).emit("auction:notice", {
          message: "Auction resumed.",
        });

        ack({
          success: true,
          state,
        });
      } catch (error) {
        acknowledgeError(ack, error);
      }
    });

    /**
     * CLOSE PLAYER
     *
     * Auctioneer manually marks the current player Sold
     * or Unsold. No automatic next player.
     */
    socket.on(
      "auction:close",
      async ({ auctionId, sold } = {}, ack = () => {}) => {
        try {
          const auction = await getAccessibleAuction(auctionId, socket.user);

          requireAuctionManager(socket.user, auction);

          if (typeof sold !== "boolean") {
            throw getError("The sold field must be true or false.", 400);
          }

          const state = await closeCurrentPlayer(
            auctionId,
            sold,
            getUserId(socket.user),
          );

          io.to(auctionRoom(auctionId)).emit("auction:state", state);

          io.to(auctionRoom(auctionId)).emit("auction:notice", {
            message: sold
              ? "Player marked as Sold."
              : "Player marked as Unsold.",
          });

          ack({
            success: true,
            state,
          });
        } catch (error) {
          acknowledgeError(ack, error);
        }
      },
    );

    socket.on("disconnect", () => {
      console.log("Auction socket disconnected:", socket.id);
    });
  });

  // Useful when the HTTP server is shutting down.
  io.on("close", () => {
    clearInterval(auctionTimer);
  });

  return io;
}
