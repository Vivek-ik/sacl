
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function MatchAdminForm({ onCreated, onCancel }) {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [f, setF] = useState({
    title: "",
    tournament: "",
    teamA: "",
    teamB: "",
    scorer: "",
    oversPerInnings: 20,
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoadingData(true);
        setError("");

        const [teamRes, userRes, tournamentRes] = await Promise.all([
          api.get("/admin/teams"),
          api.get("/admin/users", { params: { role: "scorer" } }),
          api.get("/tournaments"),
        ]);

        setTeams(teamRes.data.teams || []);
        setUsers(userRes.data.users || []);

        const tournamentData = tournamentRes.data;

        setTournaments(
          Array.isArray(tournamentData)
            ? tournamentData
            : tournamentData?.tournaments ||
                tournamentData?.data ||
                [],
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load teams, scorers or tournaments.",
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchFormData();
  }, []);

  const change = (key, value) => {
    setF((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (f.teamA === f.teamB) {
      setError("Please select two different teams.");
      return;
    }

    if (!f.tournament) {
      setError("Please select a tournament.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...f,
        oversPerInnings: Number(f.oversPerInnings),
      };

      const { data } = await api.post("/matches", payload);

      onCreated?.(data.match || data.data || data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create match.",
      );
    } finally {
      setSaving(false);
    }
  };

  const cls =
    "w-full rounded-xl border border-white/10 bg-[#050817] p-3 text-sm text-white outline-none focus:border-lime/50";

  if (loadingData) {
    return (
      <div className="py-12 text-center text-sm text-emerald-100/50">
        Loading teams, scorers and tournaments...
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Match title */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-emerald-100/60">
          Match Title
        </label>

        <input
          required
          placeholder="e.g. Match 01 - League Stage"
          value={f.title}
          onChange={(e) => change("title", e.target.value)}
          className={cls}
        />
      </div>

      {/* Tournament */}
      <div>
        <label className="mb-2 block text-xs font-semibold text-emerald-100/60">
          Tournament
        </label>

        <select
          required
          value={f.tournament}
          onChange={(e) => change("tournament", e.target.value)}
          className={cls}
        >
          <option value="">Select Tournament</option>

          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Teams */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold text-emerald-100/60">
            Team A
          </label>

          <select
            required
            value={f.teamA}
            onChange={(e) => change("teamA", e.target.value)}
            className={cls}
          >
            <option value="">Select Team A</option>

            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-emerald-100/60">
            Team B
          </label>

          <select
            required
            value={f.teamB}
            onChange={(e) => change("teamB", e.target.value)}
            className={cls}
          >
            <option value="">Select Team B</option>

            {teams
              .filter((t) => t._id !== f.teamA)
              .map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Scorer and overs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-semibold text-emerald-100/60">
            Assign Scorer
          </label>

          <select
            required
            value={f.scorer}
            onChange={(e) => change("scorer", e.target.value)}
            className={cls}
          >
            <option value="">Select Scorer</option>

            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name || u.email || u.phone}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold text-emerald-100/60">
            Overs Per Innings
          </label>

          <input
            type="number"
            min="1"
            max="50"
            required
            value={f.oversPerInnings}
            onChange={(e) =>
              change("oversPerInnings", Number(e.target.value))
            }
            className={cls}
          />
        </div>
      </div>

      {/* Automatic player selection information */}
      <div className="rounded-xl border border-lime/20 bg-lime/5 p-4">
        <p className="text-sm font-semibold text-lime">
          <span className="mr-2">✓</span>
          Automatic Squad Selection
        </p>

        <p className="mt-1 text-xs leading-5 text-emerald-100/60">
          All eligible players registered under Team A and Team B
          will automatically be included in the match squad.
          No manual player selection is required.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/5 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || loadingData}
          className="rounded-xl bg-lime px-6 py-3 text-sm font-bold text-[#071b16] hover:bg-lime/90 disabled:opacity-50"
        >
          {saving ? "Creating Match..." : "Create Match"}
        </button>
      </div>
    </form>
  );
}
