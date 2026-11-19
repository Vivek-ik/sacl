import { useCallback, useEffect, useMemo, useState } from "react";
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
  "mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 text-white outline-none focus:border-lime disabled:opacity-50";

const formatLabel = (value = "") =>
  String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatStatus = (value) =>
  value
    ? String(value).charAt(0).toUpperCase() +
      String(value).slice(1).toLowerCase()
    : "Not submitted";

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const getStatusClass = (value) => {
  switch (String(value || "").toLowerCase()) {
    case "approved":
    case "paid":
      return "border-lime/20 bg-lime/10 text-lime";

    case "rejected":
    case "failed":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    case "pending":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

    default:
      return "border-white/10 bg-white/5 text-emerald-100/50";
  }
};

// Supports both old API responses and the new array-based response.
function normalizeRegistrations(responseData) {
  const result = responseData?.data || responseData || {};

  const players = Array.isArray(result.players)
    ? result.players
    : result.player
      ? [result.player]
      : [];

  const teams = Array.isArray(result.teams)
    ? result.teams
    : result.team
      ? [result.team]
      : [];

  return { players, teams };
}

function getTournamentId(application) {
  const tournament = application?.tournament;

  if (typeof tournament === "string") return tournament;

  return tournament?._id || application?.tournamentId || "";
}

function getTournamentName(application) {
  const tournament = application?.tournament;

  if (typeof tournament === "object" && tournament?.name) {
    return tournament.name;
  }

  return application?.tournamentName || "Tournament";
}

export default function Registration() {
  const { user } = useAuth();

  const isTeamOwner = user?.role === "team_owner";
  const kind = isTeamOwner ? "team" : "player";

  const [data, setData] = useState({
    players: [],
    teams: [],
  });

  const [tournaments, setTournaments] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",

    category: "C",
    role: "BATTER",
    battingStyle: "RIGHT_HAND",
    bowlingStyle: "NONE",
    preferredJerseyNumber: "",

    name: "",
    coOwnerName: "",
    coOwnerPhone: "",
  });

  const applications = useMemo(
    () => (isTeamOwner ? data.teams : data.players),
    [isTeamOwner, data],
  );

  const registeredTournamentIds = useMemo(
    () => applications.map(getTournamentId).filter(Boolean).map(String),
    [applications],
  );

  const availableTournaments = useMemo(
    () =>
      tournaments.filter(
        (tournament) =>
          !registeredTournamentIds.includes(String(tournament._id)),
      ),
    [tournaments, registeredTournamentIds],
  );

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      fullName: user?.name || previous.fullName,
      email: user?.email || previous.email,
      phone: user?.phone || previous.phone,
    }));
  }, [user?.name, user?.email, user?.phone]);

  // GET ALL USER REGISTRATIONS
  const loadRegistrations = useCallback(async () => {
    try {
      console.log("[Registration] Calling GET /registrations/me");

      const response = await api.get("/registrations/me");

      console.log("[Registration] API response:", response.data);

      const registrations = normalizeRegistrations(response.data);

      setData(registrations);

      console.log("[Registration] Normalized registrations:", registrations);

      return registrations;
    } catch (err) {
      console.error(
        "[Registration] Failed to load registrations:",
        err.response?.data || err,
      );

      throw err;
    }
  }, []);

  // GET AVAILABLE PUBLIC TOURNAMENTS
  const loadTournaments = useCallback(async () => {
    try {
      setTournamentsLoading(true);

      console.log("[Registration] Calling GET /public/tournaments");

      const response = await api.get("/public/tournaments");

      console.log("[Registration] Tournaments response:", response.data);

      const result = response.data?.data || response.data;

      const list = Array.isArray(result)
        ? result
        : result?.tournaments || result?.data || [];

      setTournaments(Array.isArray(list) ? list : []);

      return list;
    } catch (err) {
      console.error(
        "[Registration] Failed to load tournaments:",
        err.response?.data || err,
      );

      setError(
        err.response?.data?.message ||
          "Could not load tournaments. Please refresh the page.",
      );

      setTournaments([]);
      return [];
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  // INITIAL API CALLS
  const refreshPageData = useCallback(async () => {
    setInitialLoading(true);
    setError("");

    const results = await Promise.allSettled([
      loadRegistrations(),
      loadTournaments(),
    ]);

    if (results[0].status === "rejected") {
      setError(
        results[0].reason?.response?.data?.message ||
          "Could not load your registrations. Please try again.",
      );
    }

    setInitialLoading(false);
  }, [loadRegistrations, loadTournaments]);

  useEffect(() => {
    if (!user) return;

    refreshPageData();
  }, [user, refreshPageData]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openRegistrationForm() {
    setError("");
    setSuccessMessage("");
    setSelectedTournamentId("");
    setShowForm(true);
  }

  function closeRegistrationForm() {
    setShowForm(false);
    setSelectedTournamentId("");
    setError("");
  }

  // POST PLAYER OR TEAM REGISTRATION
  async function submit(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (!selectedTournamentId) {
      setError("Please select a tournament.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = isTeamOwner
        ? {
            tournamentId: selectedTournamentId,
            name: form.name.trim(),
            coOwnerName: form.coOwnerName.trim(),
            coOwnerPhone: form.coOwnerPhone.trim(),
          }
        : {
            tournamentId: selectedTournamentId,
            fullName: form.fullName.trim(),
            category: form.category,
            role: form.role,
            battingStyle: form.battingStyle,
            bowlingStyle: form.bowlingStyle,
            preferredJerseyNumber: Number(form.preferredJerseyNumber),
          };

      console.log(
        `[Registration] Calling POST /registrations/${kind}`,
        payload,
      );

      const response = await api.post(`/registrations/${kind}`, payload);

      console.log("[Registration] Submit response:", response.data);

      setSuccessMessage(
        response.data?.message ||
          "Application submitted successfully. Pending admin approval.",
      );

      setShowForm(false);
      setSelectedTournamentId("");

      // Fetch the updated registrations after submission.
      await loadRegistrations();
    } catch (err) {
      console.error("[Registration] Submit failed:", err.response?.data || err);

      setError(
        err.response?.data?.message ||
          "Could not submit your application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderRegistrationCard(item) {
    const tournamentId = getTournamentId(item);

    return (
      <div
        key={item._id}
        className="rounded-2xl border border-white/10 bg-pitch p-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-100/40">
              Tournament
            </p>

            <h3 className="mt-1 text-lg font-bold text-white">
              {getTournamentName(item)}
            </h3>

            <p className="mt-2 text-sm text-emerald-100/60">
              {isTeamOwner
                ? `Team: ${item.name || "—"}`
                : `Player: ${item.fullName || user?.name || "—"}`}
            </p>

            {item.tournament?.season && (
              <p className="mt-1 text-xs text-emerald-100/40">
                Season: {item.tournament.season}
              </p>
            )}
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
              item.approvalStatus,
            )}`}
          >
            {formatStatus(item.approvalStatus)}
          </span>
        </div>

        {!isTeamOwner && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-emerald-100/40">Category</p>
              <p className="mt-1 font-medium">{item.category || "—"}</p>
            </div>

            <div>
              <p className="text-xs text-emerald-100/40">Playing Role</p>
              <p className="mt-1 font-medium">
                {formatLabel(item.role || "") || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-emerald-100/40">Batting Style</p>
              <p className="mt-1 font-medium">
                {formatLabel(item.battingStyle || "") || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-emerald-100/40">Jersey Number</p>
              <p className="mt-1 font-medium">
                {item.preferredJerseyNumber || "—"}
              </p>
            </div>
          </div>
        )}

        {isTeamOwner && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-emerald-100/40">Total Purse</p>
              <p className="mt-1 text-lg font-bold">
                {(item.purseTotal ?? 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-emerald-100/40">Remaining Purse</p>
              <p className="mt-1 text-lg font-bold text-lime">
                {(item.purseRemaining ?? 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="col-span-2 text-xs text-emerald-100/50">
              Squad: {item.squad?.length || 0} / 13 players
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div>
            <p className="text-xs text-emerald-100/40">Registration Fee</p>

            <span
              className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(
                item.registrationFeeStatus,
              )}`}
            >
              {formatStatus(item.registrationFeeStatus)}
            </span>
          </div>

          <p className="text-xs text-emerald-100/40">
            Registered: {formatDate(item.createdAt)}
          </p>
        </div>

        {item.approvalStatus?.toLowerCase() === "pending" && (
          <div className="mt-4 rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3">
            <p className="text-sm font-semibold text-yellow-300">
              Awaiting admin approval
            </p>
            <p className="mt-1 text-xs text-emerald-100/50">
              Your application has been submitted and is waiting for
              verification.
            </p>
          </div>
        )}

        {tournamentId && (
          <p className="mt-3 truncate text-[10px] text-emerald-100/20">
            Registration ID: {item._id}
          </p>
        )}
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div>
        <h1 className="text-3xl font-black">
          {isTeamOwner ? "Team Registration" : "Player Registration"}
        </h1>

        <div className="mt-8 flex min-h-[350px] items-center justify-center rounded-2xl border border-white/10 bg-panel">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-lime" />
            <p className="text-sm text-emerald-100/50">
              Loading your registration details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">
            {isTeamOwner ? "Team Registration" : "Player Registration"}
          </h1>

          <p className="mt-2 text-sm text-emerald-100/50">
            Manage your registrations across tournaments.
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={() => {
              if (availableTournaments.length === 0) {
                setError(
                  "No other tournaments are currently available. Please check again later.",
                );
                return;
              }

              openRegistrationForm();
            }}
            className="rounded-xl bg-lime px-5 py-3 font-bold text-pitch transition hover:opacity-90"
          >
            + Register for Another Tournament
          </button>
        )}
      </div>

      {error && (
        <div className="mt-5 flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError("")}
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mt-5 rounded-xl border border-lime/20 bg-lime/10 p-4 text-sm text-lime">
          {successMessage}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={submit}
          className="mt-6 rounded-2xl border border-white/10 bg-panel p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                {isTeamOwner ? "Team Application" : "Player Application"}
              </h2>

              <p className="mt-1 text-xs text-emerald-100/40">
                Select a tournament and complete your details.
              </p>
            </div>

            <button
              type="button"
              onClick={closeRegistrationForm}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-emerald-100/60 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>

          <div className="mt-5">
            <label className="block text-sm font-medium">
              Select Tournament
            </label>

            <select
              value={selectedTournamentId}
              onChange={(event) => setSelectedTournamentId(event.target.value)}
              required
              disabled={tournamentsLoading || availableTournaments.length === 0}
              className={inputClass}
            >
              <option value="">
                {tournamentsLoading
                  ? "Loading tournaments..."
                  : availableTournaments.length === 0
                    ? "No new tournaments available"
                    : "Select tournament"}
              </option>

              {availableTournaments.map((tournament) => (
                <option key={tournament._id} value={tournament._id}>
                  {tournament.name}
                  {tournament.season ? ` - ${tournament.season}` : ""}
                </option>
              ))}
            </select>

            {!tournamentsLoading && availableTournaments.length === 0 && (
              <p className="mt-2 text-xs text-yellow-300">
                You have already registered for all currently available
                tournaments.
              </p>
            )}
          </div>

          {isTeamOwner ? (
            <>
              <label className="mt-4 block text-sm">
                Team Name
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
                Primary Owner Name
                <input
                  required
                  name="fullName"
                  value={form.fullName}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Enter owner name"
                />
              </label>

              <label className="mt-4 block text-sm">
                Owner Email Address
                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Enter email address"
                />
              </label>

              <label className="mt-4 block text-sm">
                Owner Phone Number
                <input
                  required
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Enter phone number"
                  pattern="[+]?[0-9\s()-]{10,15}"
                />
              </label>

              <label className="mt-4 block text-sm">
                Co-owner Name
                <input
                  name="coOwnerName"
                  value={form.coOwnerName}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Enter co-owner name"
                />
              </label>

              <label className="mt-4 block text-sm">
                Co-owner Phone
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
              <label className="mt-4 block text-sm">
                Player Full Name
                <input
                  required
                  name="fullName"
                  value={form.fullName}
                  onChange={updateField}
                  className={inputClass}
                  placeholder="Enter player name"
                />
              </label>

              <label className="mt-4 block text-sm">
                Player Category
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
                Playing Role
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
                Batting Style
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
                Bowling Style
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
                Preferred Jersey Number
                <select
                  required
                  name="preferredJerseyNumber"
                  value={form.preferredJerseyNumber}
                  onChange={updateField}
                  className={inputClass}
                >
                  <option value="">Select jersey number</option>

                  {Array.from({ length: 99 }, (_, index) => index + 1).map(
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

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={
                submitting || tournamentsLoading || !selectedTournamentId
              }
              className="rounded-xl bg-lime px-5 py-3 font-bold text-pitch transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>

            <button
              type="button"
              onClick={closeRegistrationForm}
              disabled={submitting}
              className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-white hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 rounded-2xl border border-white/10 bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">My Tournament Registrations</h2>

            <p className="mt-1 text-xs text-emerald-100/40">
              All your submitted tournament applications
            </p>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold">
            {applications.length} Registration
            {applications.length === 1 ? "" : "s"}
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center">
            <h3 className="font-bold">No registrations found</h3>

            <p className="mt-2 text-sm text-emerald-100/40">
              You have not registered for any tournament yet.
            </p>

            {!showForm && (
              <button
                type="button"
                onClick={openRegistrationForm}
                disabled={availableTournaments.length === 0}
                className="mt-5 rounded-xl bg-lime px-5 py-3 font-bold text-pitch disabled:opacity-50"
              >
                Register Now
              </button>
            )}
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {applications.map(renderRegistrationCard)}
          </div>
        )}
      </div>
    </div>
  );
}
