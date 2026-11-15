import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import Match from "../models/Match.js";

const DEFAULT_PASSWORD = "Sacl@12345";

const categories = [
  "ICONIC",
  "A", "A", "A",
  "B", "B", "B",
  "C", "C", "C",
  "D", "D", "D",
];

const roles = [
  "BATTER",
  "BOWLER",
  "ALL_ROUNDER",
  "WICKET_KEEPER",
  "BATTER",
  "BOWLER",
  "ALL_ROUNDER",
  "BATTER",
  "BOWLER",
  "ALL_ROUNDER",
  "BATTER",
  "BOWLER",
  "ALL_ROUNDER",
];

const battingStyles = ["RIGHT_HAND", "LEFT_HAND"];

const bowlingStyles = [
  "RIGHT_ARM_FAST",
  "RIGHT_ARM_MEDIUM",
  "RIGHT_ARM_OFF_BREAK",
  "RIGHT_ARM_LEG_BREAK",
  "LEFT_ARM_FAST",
  "LEFT_ARM_ORTHODOX",
  "NONE",
];

const teamDefinitions = [
  { name: "Indore Warriors", ownerName: "Rahul Sharma", email: "owner1@sacl.test" },
  { name: "Bhopal Kings", ownerName: "Amit Verma", email: "owner2@sacl.test" },
  { name: "Ujjain Strikers", ownerName: "Rohit Patel", email: "owner3@sacl.test" },
  { name: "Dewas Titans", ownerName: "Vikas Jain", email: "owner4@sacl.test" },
];

async function createUser({
  name,
  email,
  phone,
  role,
}) {
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  return User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        name,
        email: email.toLowerCase(),
        phone,
        password,
        role,
        isActive: true,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function seed() {
  await connectDB();

  console.log("Starting SACL seed...");

  // 1. Admin
  const admin = await createUser({
    name: "SACL Admin",
    email: "admin@sacl.test",
    phone: "9000000001",
    role: "admin",
  });

  // 2. Scorers
  const scorer1 = await createUser({
    name: "Rahul Scorer",
    email: "scorer1@sacl.test",
    phone: "9000000002",
    role: "scorer",
  });

  const scorer2 = await createUser({
    name: "Amit Scorer",
    email: "scorer2@sacl.test",
    phone: "9000000003",
    role: "scorer",
  });

  const scorers = [scorer1, scorer2];

  // 3. Teams, owners and players
  const teams = [];

  for (let t = 0; t < teamDefinitions.length; t++) {
    const definition = teamDefinitions[t];

    const owner = await createUser({
      name: definition.ownerName,
      email: definition.email,
      phone: `900000001${t}`,
      role: "team_owner",
    });

    const team = await Team.findOneAndUpdate(
      { name: definition.name },
      {
        $set: {
          name: definition.name,
          owner: owner._id,
          coOwnerName: `${definition.ownerName} Co-Owner`,
          coOwnerPhone: `900000005${t}`,
          approvalStatus: "approved",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const teamPlayers = [];

    for (let i = 0; i < 13; i++) {
      const playerNumber = t * 13 + i + 1;

      const playerUser = await createUser({
        name: `Player ${playerNumber}`,
        email: `player${playerNumber}@sacl.test`,
        phone: `910000${String(playerNumber).padStart(4, "0")}`,
        role: "player",
      });

      const player = await Player.findOneAndUpdate(
        { user: playerUser._id },
        {
          $set: {
            user: playerUser._id,
            fullName: `Player ${playerNumber}`,
            category: categories[i],
            role: roles[i],
            battingStyle: battingStyles[i % 2],
            bowlingStyle:
              roles[i] === "BATTER"
                ? "NONE"
                : bowlingStyles[i % bowlingStyles.length],
            preferredJerseyNumber: i + 1,
            preferredTeam: team._id,
            approvalStatus: "approved",
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      teamPlayers.push(player._id);
    }

    teams.push({
      team,
      players: teamPlayers,
      owner,
    });

    console.log(`Created/updated team: ${team.name}`);
  }

  // 4. Scheduled matches
  const matchDefinitions = [
    {
      title: "SACL League - Match 1",
      teamIndexA: 0,
      teamIndexB: 1,
      scorer: scorers[0],
      oversPerInnings: 12,
    },
    {
      title: "SACL League - Match 2",
      teamIndexA: 2,
      teamIndexB: 3,
      scorer: scorers[1],
      oversPerInnings: 12,
    },
  ];

  for (const definition of matchDefinitions) {
    const teamA = teams[definition.teamIndexA];
    const teamB = teams[definition.teamIndexB];

    await Match.findOneAndUpdate(
      { title: definition.title },
      {
        $set: {
          title: definition.title,
          teamA: teamA.team._id,
          teamB: teamB.team._id,
          scorer: definition.scorer._id,
          oversPerInnings: definition.oversPerInnings,
          teamAPlayers: teamA.players,
          teamBPlayers: teamB.players,
          createdAt: admin._id,
          status: "scheduled",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(`Created/updated match: ${definition.title}`);
  }

  console.log("\nSACL seed completed successfully!");
  console.log("--------------------------------");
  console.log("Admin:    admin@sacl.test");
  console.log("Scorer 1: scorer1@sacl.test");
  console.log("Scorer 2: scorer2@sacl.test");
  console.log("Password: " + DEFAULT_PASSWORD);
  console.log("--------------------------------");
  console.log("Team owners: owner1@sacl.test to owner4@sacl.test");
  console.log("Players: player1@sacl.test to player52@sacl.test");
  console.log("--------------------------------");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });