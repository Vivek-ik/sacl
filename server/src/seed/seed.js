import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import Organization from "../models/Organization.js";
import Tournament from "../models/Tournament.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import Subscription from "../models/Subscription.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import Match from "../models/Match.js";

const DEMO_PASSWORD = "12345678";

const DEMO = {
  organizationSlug: "sacl-demo",
  organizationName: "SACL Demo Cricket Association",
  tournamentName: "SACL Premier League 2026",
  planCode: "SACL_TRIAL",
};

const teamsData = [
  "Indore Warriors",
  "Bhopal Kings",
  "Ahmedabad Strikers",
  "Mumbai Tigers",
  "Delhi Capitals",
  "Jaipur Royals",
  "Pune Panthers",
  "Chennai Challengers",
  "Lucknow Lions",
  "Nagpur Knights",
];

const playerRoles = [
  "BATTER",
  "BATTER",
  "BATTER",
  "BATTER",
  "BOWLER",
  "BOWLER",
  "BOWLER",
  "BOWLER",
  "ALL_ROUNDER",
  "ALL_ROUNDER",
  "ALL_ROUNDER",
  "WICKET_KEEPER",
  "BATTER",
];

const categories = [
  "ICONIC",
  "A",
  "A",
  "B",
  "B",
  "B",
  "C",
  "C",
  "C",
  "D",
  "D",
  "D",
  "D",
];

const makeEmail = (value) =>
  `${value.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@sacl-demo.test`;

async function upsertUser({
  name,
  email,
  passwordHash,
  role,
  organization,
  phone,
}) {
  const update = {
    $set: {
      name,
      email,
      role,
      phone,
      isActive: true,
    },
    $setOnInsert: {
      password: passwordHash,
    },
  };

  // Don't explicitly write organization: null for platform users.
  if (organization) {
    update.$set.organization = organization;
  }

  return User.findOneAndUpdate({ email }, update, {
    upsert: true,
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });
}

async function clearDatabase() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB is not connected");
  }

  const collections = await db.listCollections().toArray();

  console.log("\nClearing database...");

  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
    console.log(`Cleared: ${collection.name}`);
  }

  console.log("Database cleared successfully.\n");
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  if (!DEMO_PASSWORD || DEMO_PASSWORD.length < 8) {
    throw new Error(
      "Set SEED_DEMO_PASSWORD to a password of at least 12 characters",
    );
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // WARNING: Deletes all records from every collection.
  if (process.env.SEED_CLEAR_DB === "true") {
    await clearDatabase();
  } else {
    throw new Error(
      "Database clearing is disabled. Set SEED_CLEAR_DB=true to confirm.",
    );
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // 1. Create or reuse the platform Super Admin.
  // Never expose this account through public registration.
  const superAdmin = await upsertUser({
    name: "SACL Platform Admin",
    email: "superadmin@sacl-demo.test",
    passwordHash,
    role: "super_admin",
    phone: "9000000001",
  });

  // 2. Create/reuse the demo organization.
  // Assumed Organization fields: name, slug, status, createdBy.
  const organization = await Organization.findOneAndUpdate(
    { slug: DEMO.organizationSlug },
    {
      $set: {
        name: DEMO.organizationName,
        status: "active",
      },
      $setOnInsert: {
        createdBy: superAdmin._id,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  // 3. Create/reuse the organization admin.
  const orgAdmin = await upsertUser({
    name: "Demo Organization Admin",
    email: "admin@sacl-demo.test",
    passwordHash,
    role: "org_admin",
    organization: organization._id,
    phone: "9000000002",
  });

  // 4. Create the trial plan.
  // Assumed plan fields: code, name, priceMonthly, priceYearly,
  // trialDays, limits, isActive.
  const plan = await SubscriptionPlan.findOneAndUpdate(
    { code: DEMO.planCode },
    {
      $set: {
        name: "SACL 7 Day Trial",
        priceMonthly: 0,
        priceYearly: 0,
        trialDays: 7,
        isActive: true,
        limits: {
          tournaments: 1,
          teams: 10,
          playersPerTeam: 13,
          users: 30,
        },
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  // 5. Create/reuse the trial subscription.
  // Assumed Subscription fields: organization, plan, status,
  // startDate, trialEndsAt, currentPeriodStart, currentPeriodEnd.
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.findOneAndUpdate(
    { organization: organization._id },
    {
      $set: {
        plan: plan._id,
        status: "trialing",
        startDate: now,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  // 6. Create/reuse the tournament.
  // The organization admin is recorded as the creator.
  const tournament = await Tournament.findOneAndUpdate(
    {
      organization: organization._id,
      name: DEMO.tournamentName,
    },
    {
      $set: {
        name: DEMO.tournamentName,
        organization: organization._id,
        createdBy: orgAdmin._id, // Correct creator
        status: "active",
        auctionStatus: "pending",
        squadSize: 13,
        teamLimit: 10,
        purseTotal: 50000,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  );
  // 7. Create auctioneer and scorer.
  const auctioneer = await upsertUser({
    name: "Demo Auctioneer",
    email: "auctioneer@sacl-demo.test",
    passwordHash,
    role: "auctioneer",
    organization: organization._id,
    phone: "9000000003",
  });

  const scorer = await upsertUser({
    name: "Demo Scorer",
    email: "scorer@sacl-demo.test",
    passwordHash,
    role: "scorer",
    organization: organization._id,
    phone: "9000000004",
  });

  // 8. Create teams, owners, and 13 players per team.
  const teams = [];
  const allPlayers = [];

  for (let teamIndex = 0; teamIndex < teamsData.length; teamIndex++) {
    const teamName = teamsData[teamIndex];

    const owner = await upsertUser({
      name: `${teamName} Owner`,
      email: makeEmail(`${teamName}-owner`),
      passwordHash,
      role: "team_owner",
      organization: organization._id,
      phone: `910000${String(teamIndex + 1).padStart(4, "0")}`,
    });

    const team = await Team.findOneAndUpdate(
      {
        organization: organization._id,
        tournament: tournament._id,
        name: teamName,
      },
      {
        $set: {
          owner: owner._id,
          primaryOwner: owner._id,
          organization: organization._id,
          tournament: tournament._id,
          registrationFeeStatus: "paid",
          approvalStatus: "approved",
          purseTotal: 50000,
          purseRemaining: 50000,
          squad: [],
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    teams.push(team);

    const squad = [];

    for (let i = 0; i < 13; i++) {
      const playerName = `${teamName} Player ${i + 1}`;
      const playerEmail = makeEmail(`${teamName}-player-${i + 1}`);

      const playerUser = await upsertUser({
        name: playerName,
        email: playerEmail,
        passwordHash,
        role: "player",
        organization: organization._id,
        phone: `920${String(teamIndex + 1).padStart(2, "0")}${String(i + 1).padStart(5, "0")}`,
      });

      const player = await Player.findOneAndUpdate(
        { user: playerUser._id },
        {
          $set: {
            fullName: playerName,
            user: playerUser._id,
            organization: organization._id,
            tournament: tournament._id,
            preferredTeam: team._id,
            age: 20 + ((teamIndex + i) % 12),
            category: categories[i],
            role: playerRoles[i],
            battingStyle: i % 2 ? "Left-hand bat" : "Right-hand bat",
            bowlingStyle:
              i % 3 === 0 ? "Right-arm fast" : "Right-arm off-break",
            preferredJerseyNumber: i + 1,
            registrationFeeStatus: "paid",
            approvalStatus: "approved",
            auctionStatus: "AVAILABLE",
            soldTo: null,
            soldPrice: 0,
          },
        },
        { upsert: true, new: true, runValidators: true },
      );

      // squad.push(player._id);
      allPlayers.push(player);
    }

    // team.squad = squad;
    await team.save();
  }

  // 9. Create one scheduled match.
  const teamA = teams[0];
  const teamB = teams[1];

  const teamAPlayers = allPlayers
    .filter((player) => String(player.preferredTeam) === String(teamA._id))
    .slice(0, 11)
    .map((player) => player._id);

  const teamBPlayers = allPlayers
    .filter((player) => String(player.preferredTeam) === String(teamB._id))
    .slice(0, 11)
    .map((player) => player._id);

  const match = await Match.findOneAndUpdate(
    {
      organization: organization._id,
      tournament: tournament._id,
      title: "Opening Match - Indore vs Bhopal",
    },
    {
      $set: {
        teamA: teamA._id,
        teamB: teamB._id,
        organization: organization._id,
        tournament: tournament._id,
        teamAPlayers,
        teamBPlayers,
        oversPerInnings: 10,
        ballsPerOver: 6,
        scorer: scorer._id,
        status: "scheduled",
        currentInnings: 1,
        createdBy: orgAdmin._id,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  console.log("\n========== SACL SEED COMPLETE ==========");
  console.log("Organization:", organization.name, organization._id);
  console.log("Tournament:", tournament.name, tournament._id);
  console.log("Subscription:", subscription.status);
  console.log("Trial ends:", subscription.trialEndsAt);
  console.log("Teams:", teams.length);
  console.log("Players:", allPlayers.length);
  console.log("Match:", match.title, match._id);

  console.log("\nDEMO LOGIN ACCOUNTS");
  console.log("Super Admin: superadmin@sacl-demo.test");
  console.log("Org Admin:   admin@sacl-demo.test");
  console.log("Auctioneer:  auctioneer@sacl-demo.test");
  console.log("Scorer:      scorer@sacl-demo.test");
  console.log("Team Owner:  indore.warriors.owner@sacl-demo.test");
  console.log("Password:    value of SEED_DEMO_PASSWORD");

  console.log("\nUse these IDs when testing:");
  console.log({
    organizationId: String(organization._id),
    tournamentId: String(tournament._id),
    matchId: String(match._id),
    auctioneerId: String(auctioneer._id),
  });
}

main()
  .catch((error) => {
    console.error("SACL seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
