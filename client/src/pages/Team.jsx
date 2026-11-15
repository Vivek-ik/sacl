import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Trophy,
  UserRound,
  Phone,
  RefreshCw,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { api } from "../lib/api";

const formatStatus = (value) => {
  if (!value) return "Not submitted";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const statusClass = (value) => {
  switch (value?.toLowerCase()) {
    case "approved":
    case "paid":
      return "bg-lime/10 text-lime border-lime/20";
    case "rejected":
    case "failed":
      return "bg-red-500/10 text-red-300 border-red-500/20";
    case "pending":
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
    default:
      return "bg-white/5 text-emerald-100/60 border-white/10";
  }
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatLabel = (value) =>
  value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";

function StatusBadge({ value }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(value)}`}
    >
      {formatStatus(value)}
    </span>
  );
}

export default function Team() {
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/team/my-team");

      setTeam(response.data.team || null);
      setPlayers(response.data.players || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your team.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  if (loading) {
    return (
      <div className="grid min-h-[300px] place-items-center">
        <RefreshCw className="animate-spin text-lime" size={30} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 sm:p-6">
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={loadTeam}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-pitch"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="rounded-2xl border border-white/10 bg-panel p-6 text-center sm:p-10">
        <Trophy className="mx-auto text-lime" size={40} />
        <h2 className="mt-4 text-lg font-bold sm:text-xl">
          No team registered yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-emerald-100/50">
          Submit your team registration to view your team dashboard.
        </p>
      </div>
    );
  }

  const squadCount = team.squad?.length || 0;

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime">
            Team Management
          </p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">My Team</h1>
          <p className="mt-1 text-xs text-emerald-100/50 sm:text-sm">
            Manage your team and view player registrations.
          </p>
        </div>

        <button
          onClick={loadTeam}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs font-semibold hover:bg-white/5 sm:px-4 sm:text-sm"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Team header */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
        <div className="border-b border-white/10 bg-gradient-to-r from-lime/10 to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-lime">
                Registered Team
              </p>

              <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl">
                {team.name}
              </h2>

              <p className="mt-2 flex items-center gap-2 text-xs text-emerald-100/50 sm:text-sm">
                <CalendarDays size={14} />
                Registered on {formatDate(team.createdAt)}
              </p>
            </div>

            <div className="self-start">
              <StatusBadge value={team.approvalStatus} />
            </div>
          </div>
        </div>

        {/* Owners */}
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5">
          <div className="min-w-0 rounded-xl bg-pitch p-4">
            <div className="flex items-center gap-2 text-xs text-emerald-100/50 sm:text-sm">
              <UserRound size={16} className="shrink-0" />
              Primary Owner
            </div>
            <p className="mt-2 break-words text-sm font-semibold sm:text-base">
              {team.owner?.name || team.ownerName || "—"}
            </p>
            {team.owner?.phone && (
              <p className="mt-1 text-xs text-emerald-100/40">
                {team.owner.phone}
              </p>
            )}
          </div>

          <div className="min-w-0 rounded-xl bg-pitch p-4">
            <div className="flex items-center gap-2 text-xs text-emerald-100/50 sm:text-sm">
              <Users size={16} className="shrink-0" />
              Co-Owner
            </div>
            <p className="mt-2 break-words text-sm font-semibold sm:text-base">
              {team.coOwnerName || "—"}
            </p>
            {team.coOwnerPhone && (
              <p className="mt-1 flex items-center gap-1 text-xs text-emerald-100/40">
                <Phone size={12} />
                {team.coOwnerPhone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Team statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-100/50 sm:text-sm">
              Players in Squad
            </p>
            <Users className="text-lime" size={20} />
          </div>

          <div className="mt-3 flex items-end gap-2">
            <p className="text-3xl font-black">{squadCount}</p>
            <p className="pb-1 text-sm text-emerald-100/40">/ 13 players</p>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-lime transition-all"
              style={{
                width: `${Math.min((squadCount / 13) * 100, 100)}%`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-emerald-100/40">
            Confirmed auction purchases
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-100/50 sm:text-sm">
              Player Registrations
            </p>
            <Trophy className="text-lime" size={20} />
          </div>

          <p className="mt-3 text-3xl font-black">{players.length}</p>

          <p className="mt-2 text-xs text-emerald-100/40">
            Players preferring your team
          </p>
        </div>
      </div>

      {/* Player registrations */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
        {/* Section header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-base font-bold sm:text-lg">
              Player Registrations
            </h2>
            <p className="mt-1 text-xs text-emerald-100/50">
              Players who selected your team as their preferred team
            </p>
          </div>

          <span className="shrink-0 rounded-lg bg-lime/10 px-3 py-2 text-xs font-bold text-lime sm:text-sm">
            {players.length} Players
          </span>
        </div>

        {players.length === 0 ? (
          <div className="p-8 text-center sm:p-10">
            <Users className="mx-auto text-emerald-100/30" size={36} />
            <p className="mt-3 text-sm font-semibold sm:text-base">
              No player registrations yet
            </p>
            <p className="mt-1 text-xs text-emerald-100/40 sm:text-sm">
              Players who select your team will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile player cards */}
            <div className="divide-y divide-white/5 md:hidden">
              {players.map((player) => (
                <div key={player._id} className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
                        <UserRound size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold">
                          {player.fullName}
                        </p>
                        {player.user?.phone && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-100/40">
                            <Phone size={12} />
                            {player.user.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-md bg-lime/10 px-2.5 py-1 text-xs font-bold text-lime">
                      {player.category || "—"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded-xl bg-pitch p-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-100/40">
                        Playing Role
                      </p>
                      <p className="mt-1 text-xs font-medium">
                        {formatLabel(player.role)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-100/40">
                        Jersey Number
                      </p>
                      <p className="mt-1 text-xs font-medium">
                        {player.preferredJerseyNumber ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-100/40">
                        Batting Style
                      </p>
                      <p className="mt-1 text-xs font-medium">
                        {formatLabel(player.battingStyle)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-100/40">
                        Bowling Style
                      </p>
                      <p className="mt-1 text-xs font-medium">
                        {formatLabel(player.bowlingStyle)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge value={player.approvalStatus} />

                    <span className="flex items-center gap-1 text-[11px] text-emerald-100/40">
                      <CalendarDays size={12} />
                      {formatDate(player.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop player table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-pitch text-xs uppercase text-emerald-100/50">
                  <tr>
                    <th className="px-5 py-4">Player</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Playing Role</th>
                    <th className="px-5 py-4">Batting</th>
                    <th className="px-5 py-4">Bowling</th>
                    <th className="px-5 py-4">Jersey</th>
                    <th className="px-5 py-4">Approval</th>
                    <th className="px-5 py-4">Registered</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {players.map((player) => (
                    <tr key={player._id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{player.fullName}</p>
                        {player.user?.phone && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-100/40">
                            <Phone size={12} />
                            {player.user.phone}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-md bg-lime/10 px-2 py-1 font-bold text-lime">
                          {player.category}
                        </span>
                      </td>

                      <td className="px-5 py-4">{formatLabel(player.role)}</td>
                      <td className="px-5 py-4">
                        {formatLabel(player.battingStyle)}
                      </td>
                      <td className="px-5 py-4">
                        {formatLabel(player.bowlingStyle)}
                      </td>
                      <td className="px-5 py-4">
                        {player.preferredJerseyNumber ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge value={player.approvalStatus} />
                      </td>
                      <td className="px-5 py-4 text-emerald-100/50">
                        {formatDate(player.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Information note */}
      {/* <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-panel p-4">
        <ShieldCheck className="mt-0.5 shrink-0 text-lime" size={18} />
        <p className="text-xs leading-relaxed text-emerald-100/50 sm:text-sm">
          These players have expressed a preference for your team. They become
          confirmed squad members only after being purchased during the auction.
        </p>
      </div> */}
    </div>
  );
}
