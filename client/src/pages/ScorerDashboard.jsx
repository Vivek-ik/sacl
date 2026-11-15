import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Undo2, Flag, Play } from "lucide-react";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";

const playerName = (p) => p?.fullName || "—";
const getId = (v) => String(v?._id || v || "");
const overs = (b = 0) => `${Math.floor(b / 6)}.${b % 6}`;

const controlClass =
  "min-w-0 rounded-lg border border-white/10 bg-pitch px-2 py-2 text-xs sm:text-sm outline-none focus:border-lime";

function PlayerSelect({
  label,
  value,
  players,
  onChange,
  disabled,
  disabledPlayers = {},
}) {
  const unavailablePlayers = players.filter((p) => disabledPlayers[getId(p)]);

  const selectedReason = value ? disabledPlayers[value] : "";

  return (
    <div className="min-w-0 flex-1">
      <label className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">
          {label}
        </span>

        {selectedReason && (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-300">
            {selectedReason}
          </span>
        )}
      </label>

      <select
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${controlClass} disabled:opacity-40`}
      >
        <option value="">Select {label}</option>

        {players.map((p) => {
          const reason = disabledPlayers[getId(p)];

          return (
            <option key={p._id} value={p._id} disabled={Boolean(reason)}>
              {p.fullName}
              {reason ? ` — ${reason}` : ""}
            </option>
          );
        })}
      </select>

      {unavailablePlayers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {unavailablePlayers.map((p) => (
            <span
              key={p._id}
              className="rounded-full border border-red-400/20 bg-red-500/10 px-2 py-1 text-[9px] font-semibold text-red-300"
            >
              {p.fullName}: {disabledPlayers[getId(p)]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScorerDashboard() {
  const [matches, setMatches] = useState([]);
  const [matchId, setMatchId] = useState("");
  const [data, setData] = useState(null);
  const [rosters, setRosters] = useState([]);
  const [inningsId, setInningsId] = useState("");

  const [form, setForm] = useState({
    battingTeam: "",
    striker: "",
    nonStriker: "",
    bowler: "",
  });

  const [dismissed, setDismissed] = useState("");
  const [kind, setKind] = useState("bowled");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadMatches = useCallback(async () => {
    const { data } = await api.get("/matches");
    setMatches(data.matches || []);

    if (!matchId && data.matches?.length) {
      setMatchId(data.matches[0]._id);
    }
  }, [matchId]);

  const load = useCallback(async () => {
    if (!matchId) return;

    const [s, r] = await Promise.all([
      api.get(`/public/matches/${matchId}`),
      api.get(`/matches/${matchId}/roster`),
    ]);

    setData(s.data);
    setRosters(r.data.teams || []);

    const active = [...(s.data.innings || [])]
      .reverse()
      .find((x) => x.status === "in_progress");

    setInningsId(active?._id || "");

    if (active) {
      setForm({
        battingTeam: getId(active.battingTeam),
        striker: getId(active.striker),
        nonStriker: getId(active.nonStriker),
        bowler: getId(active.currentBowler),
      });
    } else {
      setForm({
        battingTeam: "",
        striker: "",
        nonStriker: "",
        bowler: "",
      });
    }
  }, [matchId]);

  useEffect(() => {
    loadMatches().catch((e) => setError(e.message));
  }, [loadMatches]);

  useEffect(() => {
    load().catch((e) => setError(e.response?.data?.message || e.message));
  }, [load]);

  useEffect(() => {
    if (!matchId) return;

    const socket = getSocket();
    socket.emit("match:join", matchId);

    const update = (x) => {
      if (getId(x?.match) === matchId) setData(x);
    };

    socket.on("score:update", update);

    return () => {
      socket.emit("match:leave", matchId);
      socket.off("score:update", update);
    };
  }, [matchId]);

  const run = async (fn) => {
    try {
      setBusy(true);
      setError("");
      await fn();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const innings =
    data?.innings?.find((x) => x._id === inningsId) ||
    [...(data?.innings || [])].reverse()[0];

  const isSetup = !innings || innings.status === "completed";
  const isLive = innings?.status === "in_progress";

  const activeRoster =
    rosters.find((x) => getId(x.team) === getId(form.battingTeam))?.players ||
    [];

  const bowlingRoster =
    rosters.find((x) => getId(x.team) !== getId(form.battingTeam))?.players ||
    [];

  // Batters already dismissed in this innings
  const dismissedPlayerIds = new Set(
    (innings?.battingStats || [])
      .filter((stat) => stat.isOut)
      .map((stat) => getId(stat.player)),
  );

  const batterDisabledPlayers = Object.fromEntries(
    activeRoster
      .filter((player) => dismissedPlayerIds.has(getId(player)))
      .map((player) => [getId(player), "OUT"]),
  );

  // Standard limited-overs bowling quota:
  // Maximum overs per bowler = ceil(total innings overs / 5)
  const maxBowlerOvers = Math.ceil(
    Number(data?.match?.oversPerInnings || 0) / 5,
  );

  const lastOverBowlerId = getId(data?.lastCompletedOverBowler);

  const bowlerDisabledPlayers = Object.fromEntries(
    bowlingRoster.flatMap((player) => {
      const playerId = getId(player);

      const stats = (innings?.bowlingStats || []).find(
        (stat) => getId(stat.player) === playerId,
      );

      // Bowler has completed their quota
      if (
        maxBowlerOvers > 0 &&
        (stats?.legalBalls || 0) >= maxBowlerOvers * 6
      ) {
        return [[playerId, "Quota completed"]];
      }

      // A bowler cannot bowl consecutive overs
      if (lastOverBowlerId && playerId === lastOverBowlerId) {
        return [[playerId, "Previous over"]];
      }

      return [];
    }),
  );

  const canScore =
    isLive &&
    innings?.striker &&
    innings?.nonStriker &&
    innings?.currentBowler &&
    !busy;

  const updateField = (key, value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };

      if (key === "battingTeam") {
        next.striker = "";
        next.nonStriker = "";
        next.bowler = "";
      }

      if (key === "striker" && value === f.nonStriker) {
        next.nonStriker = "";
      }

      if (key === "nonStriker" && value === f.striker) {
        next.striker = "";
      }

      return next;
    });
  };

  const start = () =>
    run(async () => {
      const number = (data?.innings?.length || 0) + 1;

      const { data: result } = await api.post(
        `/matches/${matchId}/innings/start`,
        { ...form, number },
      );

      setInningsId(result.innings._id);
    });

  const setPlayers = () =>
    run(() =>
      api.patch(`/matches/${matchId}/innings/${inningsId}/players`, form),
    );

  const ball = (runs = 0, extraType = "none", extraRuns = 0, wicket = null) =>
    run(() =>
      api.post(`/matches/${matchId}/innings/${inningsId}/deliveries`, {
        batterRuns: runs,
        extraType,
        extraRuns,
        wicket,
      }),
    );

  const teamA = data?.match?.teamA;
  const teamB = data?.match?.teamB;

  if (error && !data) {
    return (
      <div className="rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!matches.length && !data) {
    return (
      <div className="rounded-xl border border-white/10 p-6 text-center text-sm text-emerald-100/50">
        No matches assigned to this scorer account.
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] min-h-[560px] max-w-5xl flex-col gap-3 overflow-hidden px-2 sm:px-3">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-lime">
            SACL 2.0 · LIVE SCORING
          </p>
          <h1 className="text-lg font-black sm:text-xl">Scorer Console</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className={`${controlClass} max-w-[210px]`}
          >
            <option value="">Select match</option>
            {matches.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title || `${m.teamA?.name} vs ${m.teamB?.name}`}
              </option>
            ))}
          </select>

          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                await loadMatches();
                await load();
              })
            }
            className="rounded-lg border border-white/10 p-2"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>
      {error && (
        <div className="shrink-0 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      {!data && (
        <div className="flex flex-1 items-center justify-center text-sm text-emerald-100/50">
          Select an assigned match.
        </div>
      )}
      {data && (
        <>
          {/* Compact scoreboard */}
          <section className="shrink-0 rounded-xl border border-white/10 bg-panel p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[10px] text-emerald-100/50">
                  {data.match.title}
                </p>
                <h2 className="truncate text-sm font-bold">
                  {teamA?.name} vs {teamB?.name}
                </h2>
              </div>
              <span className="rounded-full bg-lime/10 px-2 py-1 text-[10px] font-bold uppercase text-lime">
                {data.match.status}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tabular-nums">
                  {innings?.totalRuns || 0}/{innings?.wickets || 0}
                </span>
                <span className="text-xs text-emerald-100/60">
                  {overs(innings?.legalBalls)} / {data.match.oversPerInnings} ov
                </span>
              </div>

              <div className="text-right text-xs">
                <p className="text-emerald-100/50">Run rate</p>
                <p className="font-bold text-lime">
                  {innings?.legalBalls
                    ? (innings.totalRuns / (innings.legalBalls / 6)).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] sm:text-xs">
              <div className="min-w-0 rounded-md bg-pitch px-2 py-2">
                <p className="text-emerald-100/40">STRIKER</p>
                <p className="truncate font-semibold">
                  {playerName(innings?.striker)}
                </p>
              </div>
              <div className="min-w-0 rounded-md bg-pitch px-2 py-2">
                <p className="text-emerald-100/40">NON-STRIKER</p>
                <p className="truncate font-semibold">
                  {playerName(innings?.nonStriker)}
                </p>
              </div>
              <div className="min-w-0 rounded-md bg-pitch px-2 py-2">
                <p className="text-emerald-100/40">BOWLER</p>
                <p className="truncate font-semibold">
                  {playerName(innings?.currentBowler)}
                </p>
              </div>
            </div>
          </section>

          {/* Innings setup */}
          {isSetup && (
            <section className="flex min-h-0 flex-1 flex-col justify-center rounded-xl border border-white/10 bg-panel p-3">
              <div className="mb-3">
                <h3 className="font-bold">
                  <Play className="mr-1 inline text-lime" size={16} />
                  Start innings {data.innings.length + 1}
                </h3>
                <p className="text-[10px] text-emerald-100/50">
                  Choose the batting side and opening players.
                </p>
              </div>

              <label className="mb-3 block">
                <span className="mb-1 block text-[10px] font-bold uppercase text-emerald-100/50">
                  Batting team
                </span>
                <select
                  value={form.battingTeam}
                  onChange={(e) => updateField("battingTeam", e.target.value)}
                  className={`w-full ${controlClass}`}
                >
                  <option value="">Select batting team</option>
                  <option value={getId(teamA)}>{teamA?.name}</option>
                  <option value={getId(teamB)}>{teamB?.name}</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <PlayerSelect
                  label="Striker"
                  value={form.striker}
                  players={activeRoster.filter(
                    (p) => getId(p) !== form.nonStriker,
                  )}
                  disabledPlayers={batterDisabledPlayers}
                  onChange={(v) => updateField("striker", v)}
                  disabled={busy}
                />

                <PlayerSelect
                  label="Non-striker"
                  value={form.nonStriker}
                  players={activeRoster.filter(
                    (p) => getId(p) !== form.striker,
                  )}
                  disabledPlayers={batterDisabledPlayers}
                  onChange={(v) => updateField("nonStriker", v)}
                  disabled={busy}
                />

                <PlayerSelect
                  label="Bowler"
                  value={form.bowler}
                  players={bowlingRoster}
                  disabledPlayers={bowlerDisabledPlayers}
                  onChange={(v) => updateField("bowler", v)}
                  disabled={busy}
                />
              </div>

              <button
                disabled={
                  busy ||
                  !form.battingTeam ||
                  !form.striker ||
                  !form.nonStriker ||
                  !form.bowler ||
                  form.striker === form.nonStriker
                }
                onClick={start}
                className="mt-4 w-full rounded-xl bg-lime p-3 text-sm font-black text-pitch disabled:opacity-30"
              >
                Start innings
              </button>
            </section>
          )}

          {/* Live scoring console */}
          {isLive && (
            <section className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
              {/* Player selectors */}
              <div className="shrink-0 rounded-xl border border-white/10 bg-panel p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold">Players on field</h3>
                  <button
                    disabled={
                      busy ||
                      !form.striker ||
                      !form.nonStriker ||
                      !form.bowler ||
                      form.striker === form.nonStriker
                    }
                    onClick={setPlayers}
                    className="rounded-md bg-lime/10 px-2 py-1 text-[10px] font-bold text-lime disabled:opacity-30"
                  >
                    Save players
                  </button>
                </div>

<div className="grid grid-cols-3 gap-3">
  <PlayerSelect
    label="Striker"
    value={form.striker}
    players={activeRoster.filter(
      (p) => getId(p) !== form.nonStriker
    )}
    disabledPlayers={batterDisabledPlayers}
    onChange={(v) => updateField("striker", v)}
    disabled={busy}
  />

  <PlayerSelect
    label="Non-striker"
    value={form.nonStriker}
    players={activeRoster.filter(
      (p) => getId(p) !== form.striker
    )}
    disabledPlayers={batterDisabledPlayers}
    onChange={(v) => updateField("nonStriker", v)}
    disabled={busy}
  />

  <PlayerSelect
    label="Bowler"
    value={form.bowler}
    players={bowlingRoster}
    disabledPlayers={bowlerDisabledPlayers}
    onChange={(v) => updateField("bowler", v)}
    disabled={busy}
  />
</div>
              </div>

              {/* Runs */}
              <div className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-xl border border-white/10 bg-panel p-3 sm:gap-4 sm:p-4">
                {/* Record runs */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold sm:text-sm">Record runs</h3>

                  {!canScore && (
                    <span className="text-[9px] text-amber-300 sm:text-[10px]">
                      Select all players first
                    </span>
                  )}
                </div>

                {/* Run buttons */}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
                  {[0, 1, 2, 3, 4, 6].map((n) => (
                    <button
                      key={n}
                      disabled={!canScore}
                      onClick={() => ball(n)}
                      className={`flex min-h-[44px] items-center justify-center rounded-lg text-base font-bold transition active:scale-95 disabled:opacity-30 sm:min-h-[54px] sm:rounded-xl sm:text-xl ${
                        n === 4 || n === 6 ? "bg-lime text-pitch" : "bg-pitch"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Extras */}
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">
                    Extras
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                    {[
                      ["WD", "wide"],
                      ["NB", "no_ball"],
                      ["BYE", "bye"],
                      ["LB", "leg_bye"],
                    ].map(([label, type]) => (
                      <button
                        key={type}
                        disabled={!canScore}
                        onClick={() => ball(0, type, 1)}
                        className="min-h-[40px] rounded-lg border border-white/10 bg-pitch px-2 py-2 text-[11px] font-bold transition active:scale-95 disabled:opacity-25 sm:min-h-[48px] sm:text-xs"
                      >
                        {label} +1
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wicket controls */}
                <div className="border-t border-white/10 pt-3">
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">
                    Wicket
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <label className="min-w-0">
                      <span className="mb-1 block text-[10px] text-emerald-100/50">
                        Dismissed batter
                      </span>

                      <select
                        value={dismissed}
                        disabled={!canScore}
                        onChange={(e) => setDismissed(e.target.value)}
                        className={`w-full min-h-[42px] text-xs sm:min-h-[46px] sm:text-sm ${controlClass}`}
                      >
                        <option value="">Select batter</option>
                        <option value={getId(innings.striker)}>
                          {playerName(innings.striker)}
                        </option>
                        <option value={getId(innings.nonStriker)}>
                          {playerName(innings.nonStriker)}
                        </option>
                      </select>
                    </label>

                    <label className="min-w-0">
                      <span className="mb-1 block text-[10px] text-emerald-100/50">
                        Wicket type
                      </span>

                      <select
                        value={kind}
                        disabled={!canScore}
                        onChange={(e) => setKind(e.target.value)}
                        className={`w-full min-h-[42px] text-xs sm:min-h-[46px] sm:text-sm ${controlClass}`}
                      >
                        {[
                          "bowled",
                          "caught",
                          "lbw",
                          "stumped",
                          "run_out",
                          "hit_wicket",
                          "obstructing_the_field",
                        ].map((k) => (
                          <option key={k} value={k}>
                            {k.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      disabled={!canScore || !dismissed}
                      onClick={() =>
                        ball(0, "none", 0, {
                          kind,
                          batter: dismissed,
                        })
                      }
                      className="min-h-[42px] w-full rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300 transition active:scale-95 disabled:opacity-25 sm:min-h-[46px] sm:w-auto sm:self-end sm:px-5 sm:text-sm"
                    >
                      OUT
                    </button>
                  </div>
                </div>
              </div>

              {/* Always-visible bottom actions */}
              <div className="grid shrink-0 grid-cols-2 gap-3 pb-1">
                {" "}
                <button
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api.post(`/matches/${matchId}/innings/${inningsId}/undo`),
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-3 text-xs font-bold disabled:opacity-30"
                >
                  <Undo2 size={15} /> Undo last ball
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    run(() =>
                      api.post(`/matches/${matchId}/innings/${inningsId}/end`),
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border border-red-500/20 py-3 text-xs font-bold text-red-300 disabled:opacity-30"
                >
                  <Flag size={15} /> End innings
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
