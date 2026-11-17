import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Radio,
  RefreshCw,
  ChevronRight,
  Trophy,
  CalendarDays,
  Clock3,
  ArrowUpRight,
  Shield,
} from "lucide-react";
import { api } from "../lib/api";

const getStatus = (status = "") => {
  const value = status.toLowerCase();

  if (["live", "in_progress", "ongoing"].includes(value)) return "live";
  if (["completed", "finished", "result"].includes(value)) return "completed";
  return "upcoming";
};

const statusStyles = {
  live: "border-red-400/20 bg-red-400/10 text-red-300",
  upcoming: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  completed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
};

function TeamBlock({ team, align = "left" }) {
  const name = team?.name || "Team";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <div
        className={`flex items-center gap-3 ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-black text-lime sm:h-14 sm:w-14">
          {initials || <Shield size={20} />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white sm:text-base">
            {name}
          </p>
          <p className="mt-1 text-[11px] text-emerald-100/40">Team</p>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }) {
  const status = getStatus(match.status);
  const isLive = status === "live";

  return (
    <Link
      to={`/live/${match._id}`}
      className="group relative block overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10251e] transition duration-300 hover:-translate-y-1 hover:border-lime/30 hover:bg-[#132c23]"
    >
      {isLive && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400 to-transparent" />
      )}

      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white/80">
            {match.title || "Tournament Match"}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-100/35">
            Samrat Ashok Cricket League
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles[status]}`}
        >
          {isLive && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          )}
          {status === "live"
            ? "Live"
            : status === "completed"
              ? "Completed"
              : "Upcoming"}
        </span>
      </div>

      <div className="px-4 py-6 sm:px-5 sm:py-7">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <TeamBlock team={match.teamA} />
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-[10px] font-black tracking-widest text-white/35">
            VS
          </div>
          <TeamBlock team={match.teamB} align="right" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100/45">
            <span className="inline-flex items-center gap-1.5">
              <Trophy size={13} />
              {match.oversPerInnings || "—"} overs
            </span>
            {match.venue && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} />
                <span className="max-w-[130px] truncate">{match.venue}</span>
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-bold text-lime transition group-hover:gap-2">
            View scorecard
            <ChevronRight size={15} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function MatchSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-3xl border border-white/10 bg-[#10251e]">
      <div className="h-16 border-b border-white/5 bg-white/[0.03]" />
      <div className="space-y-6 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/10" />
          <div className="h-8 w-12 rounded-lg bg-white/10" />
          <div className="h-14 w-14 rounded-2xl bg-white/10" />
        </div>
        <div className="h-8 rounded-lg bg-white/5" />
      </div>
    </div>
  );
}

import { LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="flex items-center justify-between border-b border-white/10 bg-[#081811] px-4 py-4 sm:px-8">
      <Link to="/" className="text-lg font-black text-white">
        SACL <span className="text-lime">2.0</span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          to="/live"
          className="rounded-xl px-3 py-2 text-sm text-emerald-100/70 hover:bg-white/5"
        >
          Live Scores
        </Link>

        {user ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-bold text-[#102018] transition hover:bg-lime/90"
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">My Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
            >
              <LogIn size={15} />
              Login
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-lime px-3 py-2.5 text-sm font-bold text-[#102018] hover:bg-lime/90"
            >
              <UserPlus size={15} />
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function LiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/public/matches");
      setMatches(Array.isArray(data.matches) ? data.matches : []);
    } catch (err) {
      console.error("Failed to load matches:", err);
      setError(
        err.response?.data?.message || "Unable to load matches right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const liveMatches = matches.filter(
    (match) => getStatus(match.status) === "live",
  );
  const upcomingMatches = matches.filter(
    (match) => getStatus(match.status) === "upcoming",
  );
  const completedMatches = matches.filter(
    (match) => getStatus(match.status) === "completed",
  );

  const sections = [
    {
      title: "Live matches",
      subtitle: "Follow the action as it happens",
      items: liveMatches,
    },
    {
      title: "Upcoming matches",
      subtitle: "Get ready for the next game",
      items: upcomingMatches,
    },
    {
      title: "Completed matches",
      subtitle: "Catch up on finished games",
      items: completedMatches,
    },
  ];

  return (
    <main className="min-h-screen bg-[#081811] pb-16 text-white">
      <Navbar/>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Tournament hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-lime/15 bg-gradient-to-br from-[#173a2b] via-[#10291f] to-[#0d2019] px-5 py-8 sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-lime">
                <Trophy size={13} />
                Official tournament coverage
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-emerald-100/45">
                SACL Cricket
              </p>
              <h1 className="mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
                Samrat Ashok
                <span className="block text-lime">Cricket League</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-100/55">
                Every run. Every wicket. Every moment. Follow live scores and
                match updates from the league.
              </p>
            </div>

            <button
              onClick={() => load()}
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh scores
            </button>
          </div>

          <div className="relative mt-8 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:max-w-md sm:gap-5">
            <div>
              <p className="text-2xl font-black tabular-nums">
                {matches.length}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-100/40">
                Matches
              </p>
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-red-300">
                {liveMatches.length}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-100/40">
                Live now
              </p>
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums">
                {completedMatches.length}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-emerald-100/40">
                Completed
              </p>
            </div>
          </div>
        </section>

        {/* Match list */}
        <div className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lime">
                Match centre
              </p>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                Fixtures & results
              </h2>
            </div>
            <span className="hidden text-xs text-emerald-100/35 sm:block">
              {matches.length} matches in this tournament
            </span>
          </div>

          {error ? (
            <div className="rounded-3xl border border-red-400/20 bg-red-400/5 px-5 py-10 text-center">
              <p className="font-bold text-red-200">{error}</p>
              <button
                onClick={() => load()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <MatchSkeleton />
              <MatchSkeleton />
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-lime">
                <CalendarDays size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold">
                No matches scheduled yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-emerald-100/45">
                Match fixtures and scorecards will appear here once they are
                published by the tournament organizers.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {sections.map(
                (section) =>
                  section.items.length > 0 && (
                    <section key={section.title}>
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold">
                            {section.title}
                          </h3>
                          <p className="mt-1 text-xs text-emerald-100/40">
                            {section.subtitle}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-emerald-100/60">
                          {section.items.length}
                        </span>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        {section.items.map((match) => (
                          <MatchCard key={match._id} match={match} />
                        ))}
                      </div>
                    </section>
                  ),
              )}
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-100/25">
          <Radio size={12} />
          Official SACL match centre
        </div>
      </div>
    </main>
  );
}
