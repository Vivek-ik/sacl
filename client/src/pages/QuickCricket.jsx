import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Trophy, Play, Trash2, RefreshCw, X } from "lucide-react";
import { api } from "../lib/api";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#081426] px-3 py-3 text-sm text-white outline-none focus:border-amber-400";

export default function QuickCricket() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [teamName, setTeamName] = useState("");
  const [playerNames, setPlayerNames] = useState([""]);

  const [matchForm, setMatchForm] = useState({
    title: "",
    teamAId: "",
    teamBId: "",
    oversPerInnings: 5,
    venue: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [teamResponse, matchResponse] = await Promise.all([
        api.get("/quick-cricket/teams"),
        api.get("/quick-cricket/matches"),
      ]);

      setTeams(teamResponse.data.teams || []);
      setMatches(matchResponse.data.matches || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load Quick Cricket.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createTeam = async (e) => {
    e.preventDefault();

    if (!teamName.trim()) return;

    try {
      setBusy(true);
      setError("");

      await api.post("/quick-cricket/teams", {
        name: teamName.trim(),
        players: playerNames
          .map((name) => ({ name: name.trim() }))
          .filter((player) => player.name),
      });

      setTeamName("");
      setPlayerNames([""]);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create team.");
    } finally {
      setBusy(false);
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm("Remove this saved team?")) return;

    try {
      await api.delete(`/quick-cricket/teams/${id}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove team.");
    }
  };

  const createMatch = async (e) => {
    e.preventDefault();

    if (!matchForm.teamAId || !matchForm.teamBId) {
      setError("Choose two teams.");
      return;
    }

    try {
      setBusy(true);
      setError("");

      const response = await api.post("/quick-cricket/matches", matchForm);

      await loadData();

      window.location.href = `/quick-cricket/matches/${response.data.match._id}`;
    } catch (err) {
      setError(err.response?.data?.message || "Could not create match.");
    } finally {
      setBusy(false);
    }
  };

  const addPlayerField = () => {
    setPlayerNames((prev) => [...prev, ""]);
  };

  const updatePlayerField = (index, value) => {
    setPlayerNames((prev) =>
      prev.map((name, i) => (i === index ? value : name)),
    );
  };

  const removePlayerField = (index) => {
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="grid min-h-[300px] place-items-center">
        <RefreshCw className="animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
            WEKHILADI · QUICK CRICKET
          </p>
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">
            Play Friendly Cricket
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create teams, start a match and keep your scores.
          </p>
        </div>

        <button
          onClick={loadData}
          className="rounded-xl border border-white/10 p-3"
          title="Refresh"
        >
          <RefreshCw size={17} />
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* CREATE SAVED TEAM */}
        <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-400/10 p-3 text-amber-400">
              <Users />
            </div>
            <div>
              <h2 className="font-bold">Create Your Team</h2>
              <p className="text-xs text-slate-400">
                Add any number of players by name.
              </p>
            </div>
          </div>

          <form onSubmit={createTeam} className="mt-5 space-y-4">
            <input
              className={inputClass}
              placeholder="Team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              maxLength={60}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Players</p>
                <span className="text-xs text-slate-400">Optional</span>
              </div>

              {playerNames.map((name, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder={`Player ${index + 1} name`}
                    value={name}
                    onChange={(e) => updatePlayerField(index, e.target.value)}
                  />
                  {playerNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayerField(index)}
                      className="rounded-lg border border-white/10 px-3 text-slate-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addPlayerField}
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-400"
              >
                <Plus size={16} /> Add player
              </button>
            </div>

            <button
              disabled={busy}
              className="w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              Save Team
            </button>
          </form>
        </section>

        {/* CREATE MATCH */}
        <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-400">
              <Trophy />
            </div>
            <div>
              <h2 className="font-bold">Start a Match</h2>
              <p className="text-xs text-slate-400">
                Pick two saved teams and play.
              </p>
            </div>
          </div>

          <form onSubmit={createMatch} className="mt-5 space-y-4">
            <input
              className={inputClass}
              placeholder="Match title (optional)"
              value={matchForm.title}
              onChange={(e) =>
                setMatchForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
            />

            <select
              className={inputClass}
              value={matchForm.teamAId}
              onChange={(e) =>
                setMatchForm((prev) => ({
                  ...prev,
                  teamAId: e.target.value,
                }))
              }
              required
            >
              <option value="">Select Team A</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={matchForm.teamBId}
              onChange={(e) =>
                setMatchForm((prev) => ({
                  ...prev,
                  teamBId: e.target.value,
                }))
              }
              required
            >
              <option value="">Select Team B</option>
              {teams
                .filter((team) => team._id !== matchForm.teamAId)
                .map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-400">
                Overs per innings
                <select
                  className={inputClass}
                  value={matchForm.oversPerInnings}
                  onChange={(e) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      oversPerInnings: Number(e.target.value),
                    }))
                  }
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} overs
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-400">
                Venue (optional)
                <input
                  className={inputClass}
                  placeholder="Turf name"
                  value={matchForm.venue}
                  onChange={(e) =>
                    setMatchForm((prev) => ({
                      ...prev,
                      venue: e.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button
              disabled={busy || teams.length < 2}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950 disabled:opacity-40"
            >
              <Play size={16} className="mr-2 inline" />
              Create Match
            </button>

            {teams.length < 2 && (
              <p className="text-xs text-amber-300">
                Create at least two saved teams to start a match.
              </p>
            )}
          </form>
        </section>
      </div>

      {/* SAVED TEAMS */}
      <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
        <h2 className="font-bold">My Saved Teams</h2>

        {teams.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            You haven't created any teams yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div
                key={team._id}
                className="rounded-xl border border-white/10 bg-[#081426] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{team.name}</h3>
                  <button
                    onClick={() => deleteTeam(team._id)}
                    className="text-slate-500 hover:text-red-400"
                    title="Archive team"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  {team.members?.length || 0} players
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {team.members?.slice(0, 6).map((player) => (
                    <span
                      key={player._id}
                      className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300"
                    >
                      {player.name}
                    </span>
                  ))}
                  {team.members?.length > 6 && (
                    <span className="text-xs text-slate-500">
                      +{team.members.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MATCH HISTORY */}
      <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
        <h2 className="font-bold">My Friendly Matches</h2>

        {matches.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">
            Your matches will appear here.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {matches.map((match) => (
              <Link
                key={match._id}
                to={`/quick-cricket/matches/${match._id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#081426] p-4 hover:border-amber-400/40"
              >
                <div>
                  <p className="font-bold">
                    {match.teamA?.name} vs {match.teamB?.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {match.oversPerInnings} overs ·{" "}
                    {match.venue || "Friendly match"}
                  </p>
                </div>

                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-bold capitalize text-amber-300">
                  {match.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
