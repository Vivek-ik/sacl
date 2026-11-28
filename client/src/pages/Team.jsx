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
  ChevronDown,
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
  const [squad, setSquad] = useState([]);
  const [tournament, setTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState([]);
  const [tournamentExpanded, setTournamentExpanded] = useState(false);
  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/team/my-team");

      setTeam(response.data.team || null);
      setSquad(response.data.squad || []);
      setPlayers(response.data.registrations || []);
      setTournament(response.data.tournament || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load your team.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/team/my-team");

      setApplications(response.data.applications || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load your team applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
    loadApplications();
  }, [loadTeam, loadApplications]);

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

  const squadCount = squad.length || 0;

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

      {/* Tournament Accordion */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
        {/* Accordion Header */}
        <button
          type="button"
          onClick={() => setTournamentExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between gap-4 bg-gradient-to-r from-lime/10 to-transparent p-4 text-left transition hover:bg-lime/5 sm:p-5"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">
              Tournament
            </p>

            <h2 className="mt-1 truncate text-lg font-black sm:text-xl">
              {tournament?.name || "Current Tournament"}
            </h2>

            <p className="mt-1 text-xs text-emerald-100/50">
              {team.name} · {tournament?.season || ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg bg-lime/10 px-2.5 py-1 text-xs font-bold text-lime">
                {squad.length}/13 Squad
              </span>

              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100/60">
                {players.length} Registrations
              </span>

              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-emerald-100/60">
                {formatStatus(team.approvalStatus)}
              </span>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-white/10 p-2">
            {tournamentExpanded ? (
              <ChevronDown className="text-lime" size={20} />
            ) : (
              <ChevronRight className="text-lime" size={20} />
            )}
          </div>
        </button>

        {tournamentExpanded && (
          <div className="space-y-5 border-t border-white/10 p-4 sm:p-5">
            {/* Team Information */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-lime">
                    Registered Team
                  </p>
                  <h3 className="mt-1 text-xl font-black">{team.name}</h3>
                  <p className="mt-1 text-xs text-emerald-100/50">
                    Registered on {formatDate(team.createdAt)}
                  </p>
                </div>
                <StatusBadge value={team.approvalStatus} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-pitch p-4">
                  <p className="text-xs text-emerald-100/50">Primary Owner</p>
                  <p className="mt-2 text-sm font-semibold">
                    {team.owner?.name || team.ownerName || "—"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/40">
                    {team.owner?.phone || ""}
                  </p>
                </div>

                <div className="rounded-xl bg-pitch p-4">
                  <p className="text-xs text-emerald-100/50">Co-Owner</p>
                  <p className="mt-2 text-sm font-semibold">
                    {team.coOwnerName || "—"}
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/40">
                    {team.coOwnerPhone || ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Squad Statistics */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-pitch p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-emerald-100/50">Confirmed Squad</p>
                  <Users className="text-lime" size={20} />
                </div>
                <p className="mt-3 text-3xl font-black">{squad.length}</p>
                <p className="mt-1 text-xs text-emerald-100/40">
                  Out of 13 players
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-lime"
                    style={{
                      width: `${Math.min((squad.length / 13) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-pitch p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-emerald-100/50">Registrations</p>
                  <Trophy className="text-lime" size={20} />
                </div>
                <p className="mt-3 text-3xl font-black">{players.length}</p>
                <p className="mt-1 text-xs text-emerald-100/40">
                  Players preferring your team
                </p>
              </div>
            </div>

            {/* Confirmed Squad */}
            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="border-b border-white/10 p-4">
                <h3 className="font-bold">Confirmed Squad</h3>
                <p className="mt-1 text-xs text-emerald-100/50">
                  Players selected through auction or direct selection
                </p>
              </div>

              {squad.length === 0 ? (
                <div className="p-6 text-center text-sm text-emerald-100/50">
                  No players selected yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {squad.map((player) => (
                    <div
                      key={player._id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime/10 text-lime">
                          <UserRound size={19} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">
                            {player.fullName}
                          </p>
                          <p className="mt-1 text-xs text-emerald-100/50">
                            {player.category} · {formatLabel(player.role)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-md bg-lime/10 px-2.5 py-1 text-xs font-bold text-lime">
                        Selected
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Player Registrations */}
            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="border-b border-white/10 p-4">
                <h3 className="font-bold">Player Registrations</h3>
                <p className="mt-1 text-xs text-emerald-100/50">
                  Players who selected your team as their preferred team
                </p>
              </div>

              {players.length === 0 ? (
                <div className="p-6 text-center text-sm text-emerald-100/50">
                  No player registrations yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {players.map((player) => (
                    <div
                      key={player._id}
                      className="flex flex-wrap items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {player.fullName}
                        </p>
                        <p className="mt-1 text-xs text-emerald-100/50">
                          {formatLabel(player.role)} · {player.category}
                        </p>
                        {player.user?.phone && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-100/40">
                            <Phone size={12} />
                            {player.user.phone}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge value={player.approvalStatus} />
                        <span className="text-xs text-emerald-100/40">
                          {formatDate(player.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
