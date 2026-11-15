import { useEffect, useState } from "react";
import { api } from "../lib/api";
// Embed in the existing admin page. Adjust the three GET endpoints if your admin API names differ.
export default function MatchAdminForm({ onCreated }) {
  const [teams, setTeams] = useState([]),
    [users, setUsers] = useState([]),
    [players, setPlayers] = useState([]),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    title: "",
    teamA: "",
    teamB: "",
    scorer: "",
    oversPerInnings: 20,
    teamAPlayers: [],
    teamBPlayers: [],
  });
  useEffect(() => {
    Promise.all([
      api.get("/admin/teams"),
      api.get("/admin/users?role=scorer"),
      api.get("/admin/players"),
    ])
      .then(([t, u, p]) => {
        setTeams(t.data.teams || []);
        setUsers(u.data.users || []);
        setPlayers(p.data.players || []);
      })
      .catch(() =>
        setError(
          "Adjust the admin teams/users/players GET endpoints to match your backend.",
        ),
      );
  }, []);
  const change = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k, id) =>
    change(k, f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id]);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post("/matches", f);
      onCreated?.(data.match);
      setF((x) => ({
        ...x,
        title: "",
        teamA: "",
        teamB: "",
        scorer: "",
        teamAPlayers: [],
        teamBPlayers: [],
      }));
    } catch (e) {
      setError(e.response?.data?.message || "Could not create match");
    } finally {
      setSaving(false);
    }
  };
  const cls = "w-full rounded-lg border border-white/10 bg-pitch p-3 text-sm";
  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-white/10 bg-panel p-4"
    >
      <h2 className="font-bold">Create match</h2>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <input
        required
        placeholder="Match title"
        value={f.title}
        onChange={(e) => change("title", e.target.value)}
        className={cls}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          required
          value={f.teamA}
          onChange={(e) => change("teamA", e.target.value)}
          className={cls}
        >
          <option value="">Team A</option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          required
          value={f.teamB}
          onChange={(e) => change("teamB", e.target.value)}
          className={cls}
        >
          <option value="">Team B</option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          required
          value={f.scorer}
          onChange={(e) => change("scorer", e.target.value)}
          className={cls}
        >
          <option value="">Assign scorer</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
        <label className="text-xs text-emerald-100/50">
          Overs per innings
          <input
            type="number"
            min="1"
            max="50"
            required
            value={f.oversPerInnings}
            onChange={(e) => change("oversPerInnings", Number(e.target.value))}
            className={`${cls} mt-1`}
          />
        </label>
      </div>
      <p className="text-xs text-emerald-100/50">
        Choose eligible players for each team roster.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["teamAPlayers", "Team A roster"],
          ["teamBPlayers", "Team B roster"],
        ].map(([k, title]) => (
          <fieldset
            key={k}
            className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-white/10 p-3"
          >
            <legend className="px-1 text-xs font-bold">{title}</legend>
            {players.map((p) => (
              <label key={p._id} className="flex gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={f[k].includes(p._id)}
                  onChange={() => toggle(k, p._id)}
                />
                {p.fullName}
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <button
        disabled={saving}
        className="w-full rounded-xl bg-lime p-3 font-bold text-pitch disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create match"}
      </button>
    </form>
  );
}
