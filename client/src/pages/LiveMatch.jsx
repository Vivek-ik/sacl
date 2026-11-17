import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Radio,
  RefreshCw,
  Trophy,
  Activity,
  Target,
  Clock3,
  Shield,
  CircleDot,
} from "lucide-react";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";

const overs = (balls = 0) =>
  `${Math.floor(Number(balls || 0) / 6)}.${Number(balls || 0) % 6}`;

const pname = (player) => player?.fullName || player?.name || "—";

const teamName = (team) => team?.name || "Team";

const getStatus = (status = "") => {
  const value = status.toLowerCase();

  if (["live", "in_progress", "ongoing"].includes(value)) return "live";
  if (["completed", "finished", "result"].includes(value)) return "completed";
  return "upcoming";
};

const formatExtras = (extras = {}) => {
  if (typeof extras === "number") return extras;
  return (
    (extras.wides || 0) +
    (extras.noBalls || 0) +
    (extras.byes || 0) +
    (extras.legByes || 0) +
    (extras.penalty || 0)
  );
};

function TeamBadge({ team }) {
  const name = teamName(team);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-black text-lime sm:h-14 sm:w-14">
      {initials || <Shield size={20} />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/40">
          {label}
        </p>
        <Icon size={15} className="text-lime/70" />
      </div>
      <p className="mt-3 text-2xl font-black tabular-nums text-white">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-xs text-emerald-100/40">{subtitle}</p>
      )}
    </div>
  );
}

function InningsCard({ innings, index }) {
  const battingStats = innings.battingStats || [];
  const bowlingStats = innings.bowlingStats || [];

  const runRate =
    innings.legalBalls > 0
      ? ((innings.totalRuns || 0) / (innings.legalBalls / 6)).toFixed(2)
      : "0.00";

  return (
    <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#10251e]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime">
            Innings {innings.number || index + 1}
          </p>
          <h3 className="mt-1 text-lg font-black">
            {teamName(innings.battingTeam)}
          </h3>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100/55">
          {innings.status || "Innings"}
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6 sm:py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/40">
            Total score
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight tabular-nums text-white sm:text-6xl">
              {innings.totalRuns || 0}
              <span className="text-3xl text-emerald-100/35">
                /{innings.wickets || 0}
              </span>
            </span>
          </div>
          <p className="mt-2 text-xs text-emerald-100/45">
            {overs(innings.legalBalls)} overs
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[210px]">
          <div className="rounded-xl bg-white/[0.04] p-3">
            <p className="text-[10px] uppercase tracking-wider text-emerald-100/40">
              Run rate
            </p>
            <p className="mt-1 text-xl font-black tabular-nums">{runRate}</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3">
            <p className="text-[10px] uppercase tracking-wider text-emerald-100/40">
              Extras
            </p>
            <p className="mt-1 text-xl font-black tabular-nums">
              {formatExtras(innings.extras)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid border-t border-white/[0.07] lg:grid-cols-2">
        {/* Batting */}
        <div className="min-w-0 p-4 sm:p-5 lg:border-r lg:border-white/[0.07]">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-lime/10 text-lime">
              <Target size={15} />
            </div>
            <div>
              <h4 className="text-sm font-bold">Batting</h4>
              <p className="text-[10px] text-emerald-100/35">
                Player performance
              </p>
            </div>
          </div>

          {battingStats.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-emerald-100/35">
                    <th className="pb-3 font-semibold">Batter</th>
                    <th className="pb-3 text-center font-semibold">R</th>
                    <th className="pb-3 text-center font-semibold">B</th>
                    <th className="pb-3 text-center font-semibold">4s</th>
                    <th className="pb-3 text-center font-semibold">6s</th>
                    <th className="pb-3 text-right font-semibold">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {battingStats.map((stat, i) => {
                    const balls = stat.balls || 0;
                    const strikeRate = balls
                      ? (((stat.runs || 0) / balls) * 100).toFixed(1)
                      : "0.0";

                    return (
                      <tr
                        key={stat.player?._id || stat.player || i}
                        className="border-b border-white/[0.045] last:border-0"
                      >
                        <td className="py-3 pr-2">
                          <p className="font-semibold text-white">
                            {pname(stat.player)}
                            {!stat.isOut && (
                              <span className="ml-1 text-lime">*</span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[10px] text-emerald-100/35">
                            {stat.isOut ? "Out" : "Not out"}
                          </p>
                        </td>
                        <td className="py-3 text-center font-bold tabular-nums">
                          {stat.runs ?? 0}
                        </td>
                        <td className="py-3 text-center text-emerald-100/55 tabular-nums">
                          {balls}
                        </td>
                        <td className="py-3 text-center text-emerald-100/55 tabular-nums">
                          {stat.fours ?? 0}
                        </td>
                        <td className="py-3 text-center text-emerald-100/55 tabular-nums">
                          {stat.sixes ?? 0}
                        </td>
                        <td className="py-3 text-right text-emerald-100/55 tabular-nums">
                          {strikeRate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl bg-white/[0.03] p-4 text-xs text-emerald-100/40">
              Batting details will appear here.
            </p>
          )}
        </div>

        {/* Bowling */}
        <div className="min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-400/10 text-sky-300">
              <Activity size={15} />
            </div>
            <div>
              <h4 className="text-sm font-bold">Bowling</h4>
              <p className="text-[10px] text-emerald-100/35">
                Bowler performance
              </p>
            </div>
          </div>

          {bowlingStats.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[260px] text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-emerald-100/35">
                    <th className="pb-3 font-semibold">Bowler</th>
                    <th className="pb-3 text-center font-semibold">O</th>
                    <th className="pb-3 text-center font-semibold">R</th>
                    <th className="pb-3 text-center font-semibold">W</th>
                    <th className="pb-3 text-right font-semibold">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {bowlingStats.map((stat, i) => {
                    const legalBalls = stat.legalBalls || 0;
                    const economy = legalBalls
                      ? ((stat.runsConceded || 0) / (legalBalls / 6)).toFixed(2)
                      : "0.00";

                    return (
                      <tr
                        key={stat.player?._id || stat.player || i}
                        className="border-b border-white/[0.045] last:border-0"
                      >
                        <td className="py-3 pr-2 font-semibold text-white">
                          {pname(stat.player)}
                        </td>
                        <td className="py-3 text-center text-emerald-100/55 tabular-nums">
                          {overs(legalBalls)}
                        </td>
                        <td className="py-3 text-center text-emerald-100/55 tabular-nums">
                          {stat.runsConceded ?? 0}
                        </td>
                        <td className="py-3 text-center font-bold tabular-nums">
                          {stat.wickets ?? 0}
                        </td>
                        <td className="py-3 text-right text-emerald-100/55 tabular-nums">
                          {economy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-xl bg-white/[0.03] p-4 text-xs text-emerald-100/40">
              Bowling details will appear here.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function RecentBalls({ deliveries }) {
  if (!deliveries.length) {
    return (
      <p className="rounded-xl bg-white/[0.03] p-4 text-xs text-emerald-100/40">
        Ball-by-ball updates will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {deliveries.map((delivery, index) => {
        const isWicket = Boolean(delivery.wicket?.kind);
        const runs = delivery.totalRuns ?? 0;

        return (
          <div
            key={delivery._id || index}
            className={`flex h-12 min-w-12 flex-col items-center justify-center rounded-xl border px-3 ${
              isWicket
                ? "border-red-400/25 bg-red-400/10 text-red-300"
                : runs === 4 || runs === 6
                  ? "border-lime/25 bg-lime/10 text-lime"
                  : "border-white/[0.07] bg-white/[0.04] text-white"
            }`}
          >
            <span className="text-sm font-black">{isWicket ? "W" : runs}</span>
            <span className="text-[9px] opacity-50">
              {delivery.overNumber}.{delivery.ballInOver}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-[#081811]">
      <div className="text-center">
        <RefreshCw className="mx-auto animate-spin text-lime" size={30} />
        <p className="mt-4 text-sm text-emerald-100/45">
          Loading match centre...
        </p>
      </div>
    </div>
  );
}

export default function LiveMatch() {
  const { matchId } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMatch = useCallback(
    async (showLoader = false) => {
      if (showLoader) setRefreshing(true);
      setError("");

      try {
        const response = await api.get(`/public/matches/${matchId}`);
        setData(response.data);
      } catch (err) {
        console.error("Match API error:", err);
        setError(
          err.response?.data?.message || "Unable to load match details.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [matchId],
  );

  useEffect(() => {
    let active = true;
    const socket = getSocket();

    const fetchMatch = async () => {
      try {
        const response = await api.get(`/public/matches/${matchId}`);

        if (active) {
          setData(response.data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message || "Unable to load match details.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const joinMatch = () => {
      socket.emit("match:join", matchId);
    };

    const update = (payload) => {
      const incoming = payload?.data || payload;
      const eventMatchId =
        typeof incoming?.match === "object"
          ? incoming.match?._id
          : incoming?.match;

      if (String(eventMatchId) === String(matchId) && active) {
        setData(incoming);
        setError("");
      }
    };

    socket.on("connect", joinMatch);
    socket.on("score:update", update);

    fetchMatch();

    if (socket.connected) {
      joinMatch();
    } else {
      socket.connect();
    }

    return () => {
      active = false;
      socket.off("connect", joinMatch);
      socket.off("score:update", update);
      if (socket.connected) socket.emit("match:leave", matchId);
    };
  }, [matchId]);

  if (loading && !data) return <LoadingScreen />;

  if (error && !data) {
    return (
      <main className="grid min-h-[65vh] place-items-center bg-[#081811] px-4 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-400/10 text-red-300">
            <Radio size={24} />
          </div>
          <h2 className="mt-5 text-xl font-black">Match unavailable</h2>
          <p className="mt-2 text-sm text-emerald-100/45">{error}</p>
          <button
            onClick={() => loadMatch(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-[#102018] hover:bg-lime/90"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!data?.match) return null;

  const { match, innings = [], recentDeliveries = [] } = data;
  const status = getStatus(match.status);
  const currentInnings =
    innings.find((item) => item.status?.toLowerCase() === "in_progress") ||
    innings[innings.length - 1];

  return (
    <main className="min-h-screen bg-[#081811] pb-16 text-white">
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/live"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-emerald-100/65 transition hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft size={15} />
            All matches
          </Link>

          <button
            onClick={() => loadMatch(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-semibold text-emerald-100/65 hover:bg-white/[0.07] disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        {/* Match header */}
        <section className="relative overflow-hidden rounded-[28px] border border-lime/15 bg-gradient-to-br from-[#173a2b] via-[#10291f] to-[#0d2019]">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-lime/10 blur-3xl" />

          <div className="relative p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-lime">
                  Samrat Ashok Cricket League
                </p>
                <h1 className="mt-2 text-lg font-black sm:text-2xl">
                  {match.title || "Tournament Match"}
                </h1>
              </div>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${
                  status === "live"
                    ? "border-red-400/25 bg-red-400/10 text-red-300"
                    : status === "completed"
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      : "border-sky-400/25 bg-sky-400/10 text-sky-300"
                }`}
              >
                {status === "live" && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                )}
                {status === "live"
                  ? "Live now"
                  : status === "completed"
                    ? "Completed"
                    : "Upcoming"}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:mt-10 sm:gap-8">
              <div className="flex min-w-0 flex-col items-center text-center">
                <TeamBadge team={match.teamA} />
                <h2 className="mt-3 max-w-full break-words text-sm font-black sm:text-xl">
                  {teamName(match.teamA)}
                </h2>
              </div>

              <div className="text-center">
                <div className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs font-black tracking-widest text-white/45 sm:px-5">
                  VS
                </div>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-emerald-100/30">
                  {match.oversPerInnings || "—"} overs
                </p>
              </div>

              <div className="flex min-w-0 flex-col items-center text-center">
                <TeamBadge team={match.teamB} />
                <h2 className="mt-3 max-w-full break-words text-sm font-black sm:text-xl">
                  {teamName(match.teamB)}
                </h2>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-100/35">
                  Match format
                </p>
                <p className="mt-1 text-sm font-bold">
                  {match.oversPerInnings || "—"} overs
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-100/35">
                  Match status
                </p>
                <p className="mt-1 text-sm font-bold capitalize">
                  {(match.status || "Scheduled").replaceAll("_", " ")}
                </p>
              </div>
              {match.venue && (
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-100/35">
                    Venue
                  </p>
                  <p className="mt-1 truncate text-sm font-bold">
                    {match.venue}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-200">
            Latest refresh failed. Showing the last available score.
          </div>
        )}
        {/* Current score */}
        {currentInnings && (
          <section className="mt-5 overflow-hidden rounded-3xl border border-lime/20 bg-[#132c22]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime">
                  {status === "live" ? "Current score" : "Latest innings"}
                </p>
                <h2 className="mt-1 text-sm font-bold">
                  {teamName(currentInnings.battingTeam)}
                </h2>
              </div>

              {status === "live" && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  Live scoring
                </span>
              )}
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-[1.2fr_1fr] sm:items-center sm:p-7">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-100/40">
                  Runs / Wickets
                </p>
                <p className="mt-2 text-6xl font-black tracking-tight tabular-nums sm:text-7xl">
                  {currentInnings.totalRuns || 0}
                  <span className="text-4xl text-emerald-100/35">
                    /{currentInnings.wickets || 0}
                  </span>
                </p>
                <p className="mt-2 text-sm text-emerald-100/55">
                  {overs(currentInnings.legalBalls)} overs completed
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Run rate"
                  value={
                    currentInnings.legalBalls
                      ? (
                          (currentInnings.totalRuns || 0) /
                          (currentInnings.legalBalls / 6)
                        ).toFixed(2)
                      : "0.00"
                  }
                  icon={Activity}
                />
                <StatCard
                  label="Wickets"
                  value={currentInnings.wickets || 0}
                  icon={Target}
                />
              </div>
            </div>
          </section>
        )}
        {/* Recent deliveries */}
        <section className="mt-8">
          <SectionHeading
            title="Recent deliveries"
            subtitle="Latest ball-by-ball updates"
          />
          <div className="rounded-3xl border border-white/[0.08] bg-[#10251e] p-4 sm:p-5">
            <RecentBalls deliveries={recentDeliveries} />
          </div>
        </section>
        {/* Innings scorecards */}
        <section className="mt-8">
          <SectionHeading
            title="Full scorecard"
            subtitle="Batting and bowling performance"
          />

          {innings.length ? (
            <div className="space-y-5">
              {innings.map((item, index) => (
                <InningsCard
                  key={item._id || index}
                  innings={item}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <CircleDot className="mx-auto text-lime/60" size={25} />
              <p className="mt-3 text-sm font-semibold">
                Scorecard not available yet
              </p>
              <p className="mt-1 text-xs text-emerald-100/40">
                The scorecard will appear when scoring begins.
              </p>
            </div>
          )}
        </section>
        {/* Result */}
        {match.result && (
          <section className="mt-8 rounded-3xl border border-lime/20 bg-lime/[0.06] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
                <Trophy size={19} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lime">
                  Match result
                </p>
                <p className="mt-2 text-base font-bold text-white">
                  {match.result}
                </p>
              </div>
            </div>
          </section>
        )}
        {/* later make organisation name dynamic and not hardcoded. */}
        <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-100/25">
          <Radio size={12} />
          Samrat Ashok Cricket League · Official Scorecard
        </div>
      </div>
    </main>
  );
}
