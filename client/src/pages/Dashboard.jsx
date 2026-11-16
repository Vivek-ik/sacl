
import { Link } from "react-router-dom";
import {
  Gavel,
  Users,
  ShieldCheck,
  Radio,
  Trophy,
  ClipboardList,
  PlusCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Tile = ({ icon: Icon, title, desc, to }) => (
  <Link
    to={to}
    className="rounded-2xl border border-white/10 bg-panel p-5 transition hover:-translate-y-1 hover:border-lime/50"
  >
    <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-lime/10 text-lime">
      <Icon />
    </div>

    <h3 className="font-bold">{title}</h3>

    <p className="mt-2 text-sm text-emerald-100/50">{desc}</p>
  </Link>
);

export default function Dashboard() {
  const { user } = useAuth();

  const isTeamOwner = user?.role === "team_owner";
  const isPlayer = user?.role === "player";
  const isAdmin = ["admin", "org_admin"].includes(user?.role);

  return (
    <div>
      {/* Welcome section */}
      <div className="rounded-3xl border border-lime/20 bg-gradient-to-br from-panel to-[#183d2c] p-7">
        <p className="text-sm font-bold uppercase tracking-widest text-lime">
          Tournament control center
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          Welcome, {user?.name}
        </h1>

        <p className="mt-2 max-w-xl text-emerald-100/60">
          {isTeamOwner
            ? "Discover cricket tournaments, register your team and track your applications."
            : isPlayer
              ? "Manage your player registration and follow your tournament journey."
              : "Manage registrations, squads and live player scores from one place."}
        </p>

        {isTeamOwner ? (
          <Link
            to="/tournaments"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 font-bold text-pitch"
          >
            <Trophy size={18} />
            Browse Tournaments
          </Link>
        ) : (
          <Link
            to="/auction"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 font-bold text-pitch"
          >
            <Radio size={18} />
            Open live auction
          </Link>
        )}
      </div>

      {/* Role-specific dashboard options */}
      <div className="mt-7">
        <h2 className="mb-4 text-xl font-black">
          {isTeamOwner ? "Team Owner Dashboard" : "Quick Actions"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            </>
          )}

          {isPlayer && (
            <Tile
              icon={Users}
              title="My Registration"
              desc="Submit and track your player registration."
              to="/registration"
            />
          )}

          {isAdmin && (
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
                desc="Create and manage your tournaments."
                to="/organizer/tournaments"
              />

              <Tile
                icon={Users}
                title="Manage Teams"
                desc="Review participating teams."
                to="/organizer/teams"
              />
            </>
          )}

          {user?.role === "auctioneer" && (
            <Tile
              icon={Gavel}
              title="Live Auction"
              desc="Control the live auction and bidding."
              to="/auction"
            />
          )}

          {user?.role === "scorer" && (
            <Tile
              icon={Radio}
              title="Scoring Dashboard"
              desc="Manage assigned live matches."
              to="/scorer"
            />
          )}
        </div>
      </div>

      {/* Tournament rules */}
      <div className="mt-7 rounded-2xl border border-white/10 bg-panel p-5">
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
