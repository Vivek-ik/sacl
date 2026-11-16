import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import auctionRoutes from "./routes/auctionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// Live scoring routes
import matchRoutes from "./routes/matchRoutes.js";
import publicMatchRoutes from "./routes/publicMatchRoutes.js";

import superAdminRoutes from "./routes/superAdminRoutes.js";
import saasRoutes from "./routes/saasRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";

import publicTournamentRoutes from "./routes/publicTournamentRoutes.js";

// Socket.IO
import { initializeAuctionSocket } from "./socket/auctionSocket.js";
import { configureScoringSocket } from "./socket/scoringSocket.js";

import { notFound, errorHandler } from "./middleware/error.js";

// use this where ever necessary
// router.use(requireSubscription);

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || ["http://localhost:5173"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
  }),
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "SACL 2.0 API",
  });
});

// Existing routes
app.use("/api/auth", authRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/auction", auctionRoutes);
app.use("/api/uploads", uploadRoutes);

// Live scoring routes
app.use("/api/matches", matchRoutes);
app.use("/api/public/matches", publicMatchRoutes);
app.use("/api/public/tournaments", publicTournamentRoutes);

app.use("/api/super-admin", superAdminRoutes);
app.use("/api/saas", saasRoutes);
app.use("/api/tournaments", tournamentRoutes);


// Error handling
app.use(notFound);
app.use(errorHandler);

// HTTP server
const server = http.createServer(app);

// Initialize existing Socket.IO server
const io = initializeAuctionSocket(server);

// Register scoring events on the SAME Socket.IO instance
configureScoringSocket(io);

app.set("io", io);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`SACL API running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
