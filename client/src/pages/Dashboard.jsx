import { Link } from "react-router-dom";
import {
  Gavel,
  Users,
  ShieldCheck,
  Radio,
  Trophy,
  ClipboardList,
  Eye,
  Settings,
  CalendarDays,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Tile = ({ icon: Icon, title, desc, to }) => (
  <Link
    to={to}
    className="group rounded-2xl border border-white/10 bg-panel p-5 transition duration-200 hover:-translate-y-1 hover:border-lime/50"
  >
    <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-lime/10 text-lime transition group-hover:bg-lime group-hover:text-pitch">
      <Icon size={21} />
    </div>

    <h3 className="font-bold">{title}</h3>

    <p className="mt-2 text-sm text-emerald-100/50">{desc}</p>

    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-lime">
      Open
      <span className="transition group-hover:translate-x-1">→</span>
    </div>
  </Link>
);

export default function Dashboard() {
  const { user } = useAuth();

  const role = user?.role;

  const isTeamOwner = role === "team_owner";
  const isPlayer = role === "player";
  const isAuctioneer = role === "auctioneer";
  const isScorer = role === "scorer";

  const isAdmin = ["admin", "org_admin"].includes(role);
  const isSuperAdmin = role === "super_admin";

  const isOrganizer = isAdmin || isSuperAdmin;

  const canManageAuction = isAuctioneer || isOrganizer;

  const welcomeMessage = isTeamOwner
    ? "Discover cricket tournaments, register your team, track applications and participate in live player auctions."
    : isPlayer
      ? "Manage your player registration and follow your tournament journey."
      : isAuctioneer
        ? "Manage your assigned auctions, control bidding and update player auction results."
        : isScorer
          ? "Manage assigned live matches and follow ongoing tournaments."
          : isOrganizer
            ? "Manage tournaments, registrations, teams, auction operations and tournament activities."
            : "Watch live cricket auctions, follow player bidding and stay updated with tournament activities.";

  return (
    <div className="space-y-7">
      {/* Welcome section */}
      <div className="rounded-3xl border border-lime/20 bg-gradient-to-br from-panel to-[#183d2c] p-7">
        <p className="text-sm font-bold uppercase tracking-widest text-lime">
          Tournament control center
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          Welcome, {user?.name || "User"}
        </h1>

        <p className="mt-2 max-w-2xl text-emerald-100/60">{welcomeMessage}</p>

        {/* Primary action */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/auction/live"
            className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 font-bold text-pitch transition hover:brightness-110"
          >
            <Eye size={18} />
            Watch Live Auction
          </Link>

          {isTeamOwner && (
            <Link
              to="/tournaments"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-bold transition hover:bg-white/5"
            >
              <Trophy size={18} />
              Browse Tournaments
            </Link>
          )}

          {canManageAuction && (
            <Link
              to="/auction"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-bold transition hover:bg-white/5"
            >
              <Gavel size={18} />
              Manage Auctions
            </Link>
          )}
        </div>
      </div>

      {/* Role-specific dashboard options */}
      <div>
        <h2 className="mb-4 text-xl font-black">
          {isTeamOwner
            ? "Team Owner Dashboard"
            : isPlayer
              ? "Player Dashboard"
              : isAuctioneer
                ? "Auctioneer Dashboard"
                : isScorer
                  ? "Scorer Dashboard"
                  : isOrganizer
                    ? "Administration"
                    : "Explore Tournaments"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {/* Team Owner */}
          {isTeamOwner && (
            <>
              <Tile
                icon={Trophy}
                title="Browse Tournaments"
                desc="Explore available tournaments and apply with your team."
                to="/tournaments"
              />

              <Tile
                icon={ClipboardList}
                title="My Applications"
                desc="Track pending, approved and rejected tournament applications."
                to="/team"
              />

              <Tile
                icon={Users}
                title="My Team"
                desc="Manage your team and view your registered squad."
                to="/team"
              />

              <Tile
                icon={Eye}
                title="Watch Live Auction"
                desc="Follow live player bidding and auction results."
                to="/auction/live"
              />
            </>
          )}

          {/* Player */}
          {isPlayer && (
            <>
              <Tile
                icon={UserRound}
                title="My Registration"
                desc="Submit and track your player registration."
                to="/registration"
              />

              <Tile
                icon={Eye}
                title="Watch Live Auction"
                desc="Watch player bidding and follow auction updates."
                to="/auction/live"
              />
            </>
          )}

          {/* Admin and Super Admin */}
          {isOrganizer && (
            <>
              <Tile
                icon={ShieldCheck}
                title="Admin Approvals"
                desc="Review player and team applications."
                to="/admin"
              />

              <Tile
                icon={Trophy}
                title="Manage Tournaments"
                desc="Create and manage tournaments."
                to="/organizer/tournaments"
              />

              <Tile
                icon={Users}
                title="Manage Teams"
                desc="Review participating teams and their registrations."
                to="/organizer/teams"
              />

              <Tile
                icon={Gavel}
                title="Manage Auctions"
                desc="Create auctions, assign auctioneers and manage bidding."
                to="/auction"
              />

              <Tile
                icon={Eye}
                title="Watch Live Auction"
                desc="View live auction activity without operating it."
                to="/auction/live"
              />

              {isSuperAdmin && (
                <Tile
                  icon={Settings}
                  title="Platform Management"
                  desc="Manage platform-level settings and operations."
                  to="/admin"
                />
              )}
            </>
          )}

          {/* Auctioneer */}
          {isAuctioneer && (
            <>
              <Tile
                icon={Gavel}
                title="Manage Live Auction"
                desc="Control assigned auctions, start players and manage bidding."
                to="/auction"
              />

              <Tile
                icon={Eye}
                title="Watch Live Auction"
                desc="View live auction activity."
                to="/auction/live"
              />
            </>
          )}

          {/* Scorer */}
          {isScorer && (
            <>
              <Tile
                icon={Radio}
                title="Scoring Dashboard"
                desc="Manage assigned live matches."
                to="/scorer"
              />

              <Tile
                icon={Eye}
                title="Watch Live Auction"
                desc="Follow live player auctions and results."
                to="/auction/live"
              />
            </>
          )}

          {/* Any other authenticated user */}
          {!isTeamOwner &&
            !isPlayer &&
            !isAuctioneer &&
            !isScorer &&
            !isOrganizer && (
              <>
                <Tile
                  icon={Eye}
                  title="Watch Live Auction"
                  desc="Watch ongoing auctions and follow player bidding."
                  to="/auction/live"
                />

                <Tile
                  icon={CalendarDays}
                  title="Browse Tournaments"
                  desc="Explore tournaments and their activities."
                  to="/tournaments"
                />
              </>
            )}
        </div>
      </div>

      {/* Tournament rules */}
      <div className="rounded-2xl border border-white/10 bg-panel p-5">
        <h2 className="font-bold">Tournament rules</h2>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-2xl font-black text-lime">50,000</p>
            <p className="text-emerald-100/50">Team purse</p>
          </div>

          <div>
            <p className="text-2xl font-black text-lime">13</p>
            <p className="text-emerald-100/50">Squad size</p>
          </div>

          <div>
            <p className="text-2xl font-black text-lime">45 sec</p>
            <p className="text-emerald-100/50">Bid timer</p>
          </div>

          <div>
            <p className="text-2xl font-black text-lime">500</p>
            <p className="text-emerald-100/50">Slot reserve</p>
          </div>
        </div>
      </div>
    </div>
  );
}
