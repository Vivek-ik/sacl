import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const categories = ["ICONIC", "A", "B", "C", "D"];

const playingRoles = ["BATTER", "BOWLER", "ALL_ROUNDER", "WICKET_KEEPER"];

const battingStyles = ["RIGHT_HAND", "LEFT_HAND"];

const bowlingStyles = [
  "NONE",
  "RIGHT_ARM_FAST",
  "RIGHT_ARM_MEDIUM",
  "RIGHT_ARM_OFF_BREAK",
  "RIGHT_ARM_LEG_BREAK",
  "LEFT_ARM_FAST",
  "LEFT_ARM_MEDIUM",
  "LEFT_ARM_ORTHODOX",
  "LEFT_ARM_CHINAMAN",
];

const inputClass =
  "mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 text-white outline-none focus:border-lime";

const formatLabel = (value) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function Registration() {
  const { user } = useAuth();

  const isTeamOwner = user?.role === "team_owner";
  const kind = isTeamOwner ? "team" : "player";

  const [data, setData] = useState({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const [form, setForm] = useState({
    fullName: user?.name || "",
    category: "C",
    role: "BATTER",
    battingStyle: "RIGHT_HAND",
    bowlingStyle: "NONE",
    preferredJerseyNumber: "",
    preferredTeamId: "",
    name: "",
    coOwnerName: "",
    coOwnerPhone: "",
  });

  useEffect(() => {
    if (user?.name) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name,
      }));
    }
  }, [user?.name]);

  useEffect(() => {
    if (!isTeamOwner) {
      loadTeams();
    }
  }, [isTeamOwner]);

  async function loadTournaments() {
    setTournamentsLoading(true);

    try {
      const response = await api.get("/public/tournaments");

      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.tournaments || response.data?.data || [];

      setTournaments(list);

      // Automatically select if only one tournament exists
      if (list.length === 1) {
        setSelectedTournamentId(list[0]._id);
      }
    } catch (error) {
      console.error("Failed to load tournaments:", error);
      setTournaments([]);
    } finally {
      setTournamentsLoading(false);
    }
  }

  async function loadTeams() {
    setTeamsLoading(true);

    try {
      const response = await api.get("/registrations/available-teams");

      setTeams(response.data.teams || []);
    } catch (error) {
      console.error("Failed to load approved teams:", error);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }
  async function load() {
    try {
      const response = await api.get("/registrations/me");
      setData(response.data);
    } catch (error) {
      console.error("Registration loading failed:", error);
    }
  }

  useEffect(() => {
    load();
    loadTournaments();
  }, []);

  const formatStatus = (value) =>
    value
      ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      : "Not submitted";

  const getStatusClass = (value) => {
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
        return "bg-white/5 text-emerald-100/50 border-white/10";
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

  const team = data.team;
  const player = data.player;
  //   const application = isTeamOwner ? team : player;
  //   const status = application?.approvalStatus || "Not submitted";

  function updateField(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const payload = isTeamOwner
        ? {
            tournamentId: selectedTournamentId,
            name: form.name,
            coOwnerName: form.coOwnerName,
            coOwnerPhone: form.coOwnerPhone,
          }
        : {
            tournamentId: selectedTournamentId,
            fullName: form.fullName,
            category: form.category,
            role: form.role,
            battingStyle: form.battingStyle,
            bowlingStyle: form.bowlingStyle,
            preferredJerseyNumber: Number(form.preferredJerseyNumber),
          };
      await api.post(`/registrations/${kind}`, payload);

      setMsg("Application submitted successfully. Pending admin approval.");

      await load();
    } catch (error) {
      setMsg(error.response?.data?.message || "Could not submit application");
    } finally {
      setLoading(false);
    }
  }

  const application = isTeamOwner ? data.team : data.player;

  const status = application?.approvalStatus || "Not submitted";

  return (
    <div>
      <h1 className="text-3xl font-black">
        {isTeamOwner ? "Team Registration" : "Player Registration"}
      </h1>

      <p className="mt-2 text-sm text-emerald-100/50">
        Complete your tournament application.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]">
        {!application && (
          <form
            onSubmit={submit}
            className="rounded-2xl border border-white/10 bg-panel p-5"
          >
            <h2 className="text-xl font-bold">
              {isTeamOwner ? "Team application" : "Player application"}
            </h2>

            {isTeamOwner ? (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium">
                    Select Tournament
                  </label>

                  <select
                    value={selectedTournamentId}
                    onChange={(e) => setSelectedTournamentId(e.target.value)}
                    required
                    disabled={tournamentsLoading || tournaments.length === 0}
                    className={inputClass}
                  >
                    <option value="">
                      {tournamentsLoading
                        ? "Loading tournaments..."
                        : tournaments.length === 0
                          ? "No tournaments available"
                          : "Select tournament"}
                    </option>

                    {tournaments.map((tournament) => (
                      <option key={tournament._id} value={tournament._id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>

                  {tournaments.length === 1 && (
                    <p className="mt-2 text-xs text-lime">
                      Your tournament has been automatically selected.
                    </p>
                  )}
                </div>
                <label className="mt-4 block text-sm">
                  Team name
                  <input
                    required
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Enter team name"
                  />
                </label>

                <label className="mt-4 block text-sm">
                  Primary Owner
                  <input
                    value={user?.name || ""}
                    disabled
                    className={`${inputClass} opacity-60`}
                  />
                </label>

                <label className="mt-4 block text-sm">
                  Co-owner name
                  <input
                    name="coOwnerName"
                    value={form.coOwnerName}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Enter co-owner name"
                  />
                </label>

                <label className="mt-4 block text-sm">
                  Co-owner phone
                  <input
                    name="coOwnerPhone"
                    type="tel"
                    value={form.coOwnerPhone}
                    onChange={updateField}
                    className={inputClass}
                    placeholder="Enter co-owner phone"
                  />
                </label>
              </>
            ) : (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium">
                    Select Tournament
                  </label>

                  <select
                    value={selectedTournamentId}
                    onChange={(e) => setSelectedTournamentId(e.target.value)}
                    required
                    disabled={tournamentsLoading || tournaments.length === 0}
                    className={inputClass}
                  >
                    <option value="">
                      {tournamentsLoading
                        ? "Loading tournaments..."
                        : tournaments.length === 0
                          ? "No tournaments available"
                          : "Select tournament"}
                    </option>

                    {tournaments.map((tournament) => (
                      <option key={tournament._id} value={tournament._id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>

                  {tournaments.length === 1 && (
                    <p className="mt-2 text-xs text-lime">
                      Your tournament has been automatically selected.
                    </p>
                  )}
                </div>
                <label className="mt-4 block text-sm">
                  Player full name
                  <input
                    required
                    name="fullName"
                    value={form.fullName}
                    onChange={updateField}
                    className={inputClass}
                  />
                </label>

                <label className="mt-4 block text-sm">
                  Player category
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 block text-sm">
                  Playing role
                  <select
                    name="role"
                    value={form.role}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {playingRoles.map((item) => (
                      <option key={item} value={item}>
                        {formatLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 block text-sm">
                  Batting style
                  <select
                    name="battingStyle"
                    value={form.battingStyle}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {battingStyles.map((item) => (
                      <option key={item} value={item}>
                        {formatLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 block text-sm">
                  Bowling style
                  <select
                    name="bowlingStyle"
                    value={form.bowlingStyle}
                    onChange={updateField}
                    className={inputClass}
                  >
                    {bowlingStyles.map((item) => (
                      <option key={item} value={item}>
                        {formatLabel(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-4 block text-sm">
                  Preferred jersey number
                  <select
                    required
                    name="preferredJerseyNumber"
                    value={form.preferredJerseyNumber}
                    onChange={updateField}
                    className={inputClass}
                  >
                    <option value="">Select jersey number</option>
                    {Array.from({ length: 99 }, (_, i) => i + 1).map(
                      (number) => (
                        <option key={number} value={number}>
                          {number}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={loading || status === "APPROVED"}
              className="mt-6 rounded-xl bg-lime px-5 py-3 font-bold text-pitch disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit application"}
            </button>

            {msg && <p className="mt-4 text-sm text-lime">{msg}</p>}
          </form>
        )}

        <div className="rounded-2xl border border-white/10 bg-panel p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold">Application Status</h3>
              <p className="mt-1 text-xs text-emerald-100/40">
                Your tournament registration details
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(status)}`}
            >
              {formatStatus(status)}
            </span>
          </div>

          {!application ? (
            <div className="mt-6 rounded-xl border border-dashed border-white/10 p-5 text-center">
              <p className="text-sm font-semibold">
                No application submitted yet
              </p>
              <p className="mt-2 text-xs text-emerald-100/40">
                Complete the registration form to see your application details
                here.
              </p>
            </div>
          ) : isTeamOwner ? (
            <>
              {/* Team identity */}
              <div className="mt-5 rounded-xl border border-white/10 bg-pitch p-4">
                <p className="text-xs uppercase tracking-wider text-emerald-100/40">
                  Registered Team
                </p>

                <h2 className="mt-2 text-2xl font-black text-lime">
                  {team.name}
                </h2>

                <p className="mt-2 text-xs text-emerald-100/40">
                  Registered on {formatDate(team.createdAt)}
                </p>
              </div>

              {/* Owner details */}
              <div className="mt-5">
                <h4 className="text-sm font-bold text-white">
                  Ownership Details
                </h4>

                <div className="mt-3 space-y-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-emerald-100/50">Primary Owner</span>
                    <span className="text-right font-medium">
                      {user?.name || "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-emerald-100/50">Co-Owner</span>
                    <span className="text-right font-medium">
                      {team.coOwnerName || "Not added"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-emerald-100/50">Co-Owner Phone</span>
                    <span className="text-right font-medium">
                      {team.coOwnerPhone || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Approval and payment */}
              <div className="mt-5 border-t border-white/10 pt-5">
                <h4 className="text-sm font-bold">Verification</h4>

                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-emerald-100/50">
                      Application
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(team.approvalStatus)}`}
                    >
                      {formatStatus(team.approvalStatus)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-emerald-100/50">
                      Registration Fee
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(team.registrationFeeStatus)}`}
                    >
                      {formatStatus(team.registrationFeeStatus)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purse details */}
              <div className="mt-5 border-t border-white/10 pt-5">
                <h4 className="text-sm font-bold">Auction Purse</h4>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-pitch p-3">
                    <p className="text-xs text-emerald-100/40">Total Purse</p>
                    <p className="mt-2 text-xl font-black">
                      {(team.purseTotal ?? 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-emerald-100/30">Points</p>
                  </div>

                  <div className="rounded-xl bg-pitch p-3">
                    <p className="text-xs text-emerald-100/40">Remaining</p>
                    <p className="mt-2 text-xl font-black text-lime">
                      {(team.purseRemaining ?? 0).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-emerald-100/30">Points</p>
                  </div>
                </div>
              </div>

              {/* Squad details */}
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                <div>
                  <h4 className="text-sm font-bold">Team Squad</h4>
                  <p className="mt-1 text-xs text-emerald-100/40">
                    Players acquired in auction
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-lime">
                    {team.squad?.length || 0}
                  </p>
                  <p className="text-xs text-emerald-100/40">/ 13 Players</p>
                </div>
              </div>

              {team.approvalStatus?.toLowerCase() === "pending" && (
                <div className="mt-5 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3">
                  <p className="text-sm font-semibold text-yellow-300">
                    Awaiting admin approval
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/50">
                    Your team application is submitted. The administrator will
                    verify your details and registration fee.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Player summary */}
              <div className="mt-5 rounded-xl border border-white/10 bg-pitch p-4">
                <p className="text-xs uppercase tracking-wider text-emerald-100/40">
                  Registered Player
                </p>
                <h2 className="mt-2 text-xl font-black text-lime">
                  {player.fullName}
                </h2>
                <p className="mt-2 text-xs text-emerald-100/40">
                  Registered on {formatDate(player.createdAt)}
                </p>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-100/50">Category</span>
                  <span>{player.category}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-emerald-100/50">Playing Role</span>
                  <span>{formatLabel(player.role || "")}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-emerald-100/50">Batting Style</span>
                  <span>{formatLabel(player.battingStyle || "")}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-emerald-100/50">Bowling Style</span>
                  <span>{formatLabel(player.bowlingStyle || "")}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-emerald-100/50">Jersey Number</span>
                  <span>{player.preferredJerseyNumber || "—"}</span>
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-100/50">
                    Application
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${getStatusClass(player.approvalStatus)}`}
                  >
                    {formatStatus(player.approvalStatus)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-100/50">
                    Registration Fee
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${getStatusClass(player.registrationFeeStatus)}`}
                  >
                    {formatStatus(player.registrationFeeStatus)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
