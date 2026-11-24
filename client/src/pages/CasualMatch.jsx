import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Undo2, Play, Flag } from "lucide-react";
import { api } from "../lib/api";

const buttonClass =
  "grid min-h-14 place-items-center rounded-xl border border-white/10 bg-[#1b304a] text-lg font-black transition hover:border-amber-400 hover:bg-amber-400/10 disabled:opacity-40";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#081426] p-3 text-sm text-white";

const oversText = (balls = 0) => `${Math.floor(balls / 6)}.${balls % 6}`;

const strikeRate = (runs, balls) =>
  balls ? ((runs / balls) * 100).toFixed(2) : "0.00";

const economy = (runs, balls) =>
  balls ? ((runs * 6) / balls).toFixed(2) : "0.00";

export default function CasualMatch() {
  const { matchId } = useParams();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [opening, setOpening] = useState({
    strikerId: "",
    nonStrikerId: "",
    bowlerId: "",
  });

  const [selectedBowlerId, setSelectedBowlerId] = useState("");
  const [wicketForm, setWicketForm] = useState({
    dismissedPlayerId: "",
    incomingPlayerId: "",
    dismissal: "bowled",
  });

  const loadMatch = useCallback(async () => {
    try {
      setError("");
      const response = await api.get(`/quick-cricket/matches/${matchId}`);
      const data = response.data.match;

      setMatch(data);

      const current = data.innings?.find(
        (item) => item.number === data.currentInnings,
      );

      if (current?.bowlerId) {
        setSelectedBowlerId(String(current.bowlerId));
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load match.");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  const runAction = async (action) => {
    try {
      setBusy(true);
      setError("");
      await action();
      await loadMatch();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const firstInnings = match?.innings?.find((i) => i.number === 1);
  const secondInnings = match?.innings?.find((i) => i.number === 2);
  const innings = match?.innings?.find(
    (i) => i.number === match?.currentInnings,
  );

  const battingTeam = innings
    ? innings.battingTeamIndex === 0
      ? match.teamA
      : match.teamB
    : null;

  const bowlingTeam = innings
    ? innings.battingTeamIndex === 0
      ? match.teamB
      : match.teamA
    : null;

  const target = firstInnings ? firstInnings.runs + 1 : null;
  const isScheduled = match?.status === "scheduled";
  const isLive = match?.status === "live" && innings?.status === "in_progress";
  const firstInningsDone =
    firstInnings?.status === "completed" && !secondInnings;
  const canScore = isLive && !busy;

  const openingBattingTeam =
    opening.battingTeamIndex === 1 ? match?.teamB : match?.teamA;

  const openingBowlingTeam =
    opening.battingTeamIndex === 1 ? match?.teamA : match?.teamB;

  // The batting side for the first innings is Team A by default.
  const [battingFirstIndex, setBattingFirstIndex] = useState(0);

  const firstBattingTeam =
    battingFirstIndex === 0 ? match?.teamA : match?.teamB;

  const firstBowlingTeam =
    battingFirstIndex === 0 ? match?.teamB : match?.teamA;

  const secondBattingTeam =
    firstInnings?.battingTeamIndex === 0 ? match?.teamB : match?.teamA;

  const secondBowlingTeam =
    firstInnings?.battingTeamIndex === 0 ? match?.teamA : match?.teamB;

  const startMatch = () =>
    runAction(() =>
      api.post(`/quick-cricket/matches/${matchId}/start`, {
        battingTeamIndex: battingFirstIndex,
        strikerId: opening.strikerId,
        nonStrikerId: opening.nonStrikerId,
        bowlerId: opening.bowlerId,
      }),
    );

  const startSecond = () =>
    runAction(() =>
      api.post(`/quick-cricket/matches/${matchId}/next-innings`, {
        strikerId: opening.strikerId,
        nonStrikerId: opening.nonStrikerId,
        bowlerId: opening.bowlerId,
      }),
    );

  const score = (runs = 0, extraType = "none", extraRuns = 0) =>
    runAction(() =>
      api.post(`/quick-cricket/matches/${matchId}/score`, {
        runs,
        extraType,
        extraRuns,

        strikerId: innings?.strikerId,
        nonStrikerId: innings?.nonStrikerId,
        bowlerId: selectedBowlerId || innings?.bowlerId,
      }),
    );

  const recordWicket = () => {
    if (!wicketForm.dismissedPlayerId || !wicketForm.incomingPlayerId) {
      setError("Select the dismissed and incoming batter.");
      return;
    }

    runAction(() =>
      api.post(`/quick-cricket/matches/${matchId}/score`, {
        runs: 0,
        extraType: "none",
        extraRuns: 0,
        wicket: true,

        strikerId: innings?.strikerId,
        nonStrikerId: innings?.nonStrikerId,
        bowlerId: selectedBowlerId || innings?.bowlerId,

        dismissedPlayerId: wicketForm.dismissedPlayerId,
        incomingPlayerId: wicketForm.incomingPlayerId,
        dismissal: wicketForm.dismissal,
      }),
    );

    setWicketForm({
      dismissedPlayerId: "",
      incomingPlayerId: "",
      dismissal: "bowled",
    });
  };

  const undo = () =>
    runAction(() => api.post(`/quick-cricket/matches/${matchId}/undo`));

  const finishInnings = () =>
    runAction(() =>
      api.post(`/quick-cricket/matches/${matchId}/finish-innings`),
    );

  const availableIncomingPlayers = useMemo(() => {
    if (!battingTeam || !innings) return [];

    const alreadyOut = new Set(
      innings.battingStats
        ?.filter((p) => p.isOut)
        .map((p) => String(p.playerId)) || [],
    );

    return battingTeam.players.filter(
      (p) =>
        !alreadyOut.has(String(p.memberId)) &&
        String(p.memberId) !== String(innings.strikerId) &&
        String(p.memberId) !== String(innings.nonStrikerId),
    );
  }, [battingTeam, innings]);

  if (loading) {
    return (
      <div className="grid min-h-[300px] place-items-center">
        <RefreshCw className="animate-spin text-amber-400" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="rounded-xl bg-red-500/10 p-5 text-red-300">
        {error || "Match not found."}
        <button onClick={loadMatch} className="ml-3 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <Link
          to="/quick-cricket"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft size={17} /> Quick Cricket
        </Link>

        <button
          onClick={loadMatch}
          className="rounded-lg border border-white/10 p-2"
          title="Refresh score"
        >
          <RefreshCw size={16} />
        </button>
      </header>

      {error && (
        <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* MATCH SCORE */}
      <section className="rounded-2xl border border-white/10 bg-[#142238] p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
          WEKHILADI · FRIENDLY CRICKET
        </p>

        <h1 className="mt-2 text-xl font-black">
          {match.title || "Friendly Match"}
        </h1>

        {match.venue && (
          <p className="mt-1 text-xs text-slate-400">{match.venue}</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[match.teamA, match.teamB].map((team, index) => {
            const teamInnings = match.innings?.find(
              (item) => item.battingTeamIndex === index,
            );

            return (
              <div
                key={index}
                className={`rounded-xl p-4 ${
                  innings?.battingTeamIndex === index
                    ? "border border-amber-400/40 bg-amber-400/10"
                    : "bg-[#081426]"
                }`}
              >
                <p className="truncate text-sm font-bold">{team.name}</p>
                <p className="mt-2 text-3xl font-black text-amber-400">
                  {teamInnings?.runs ?? 0}
                  <span className="text-lg text-slate-400">
                    /{teamInnings?.wickets ?? 0}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {teamInnings
                    ? `${oversText(teamInnings.legalBalls)} overs`
                    : "Yet to bat"}
                </p>
              </div>
            );
          })}
        </div>

        {innings && (
          <div className="mt-5 rounded-xl bg-[#081426] p-4">
            <p className="text-sm font-bold">{battingTeam?.name} batting</p>
            <p className="mt-2 text-4xl font-black text-white">
              {innings.runs}/{innings.wickets}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Overs {oversText(innings.legalBalls)} / {match.oversPerInnings}
            </p>

            {innings.number === 2 && (
              <p className="mt-2 text-xs font-semibold text-amber-400">
                Target: {target} · Need {Math.max(0, target - innings.runs)}{" "}
                runs
              </p>
            )}
          </div>
        )}

        {match.status === "completed" && (
          <div className="mt-4 rounded-xl bg-emerald-400/10 p-4 text-sm font-bold text-emerald-300">
            {match.result || "Match completed"}
          </div>
        )}
      </section>

      {/* FIRST INNINGS SETUP */}
      {isScheduled && (
        <section className="space-y-4 rounded-2xl border border-white/10 bg-[#142238] p-5">
          <h2 className="font-bold">Start Match · Select Players</h2>

          <label className="block text-sm text-slate-300">
            Batting first
            <select
              className={`${inputClass} mt-2`}
              value={battingFirstIndex}
              onChange={(e) => {
                setBattingFirstIndex(Number(e.target.value));
                setOpening({
                  strikerId: "",
                  nonStrikerId: "",
                  bowlerId: "",
                });
              }}
            >
              <option value={0}>{match.teamA.name}</option>
              <option value={1}>{match.teamB.name}</option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-300">
              Opening striker
              <select
                className={`${inputClass} mt-2`}
                value={opening.strikerId}
                onChange={(e) =>
                  setOpening((p) => ({ ...p, strikerId: e.target.value }))
                }
              >
                <option value="">Select striker</option>
                {firstBattingTeam?.players.map((p) => (
                  <option key={p.memberId} value={p.memberId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Non-striker
              <select
                className={`${inputClass} mt-2`}
                value={opening.nonStrikerId}
                onChange={(e) =>
                  setOpening((p) => ({ ...p, nonStrikerId: e.target.value }))
                }
              >
                <option value="">Select non-striker</option>
                {firstBattingTeam?.players
                  .filter((p) => String(p.memberId) !== opening.strikerId)
                  .map((p) => (
                    <option key={p.memberId} value={p.memberId}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <label className="block text-sm text-slate-300">
            Opening bowler
            <select
              className={`${inputClass} mt-2`}
              value={opening.bowlerId}
              onChange={(e) =>
                setOpening((p) => ({ ...p, bowlerId: e.target.value }))
              }
            >
              <option value="">Select bowler</option>
              {firstBowlingTeam?.players.map((p) => (
                <option key={p.memberId} value={p.memberId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <button
            disabled={
              busy ||
              !opening.strikerId ||
              !opening.nonStrikerId ||
              !opening.bowlerId
            }
            onClick={startMatch}
            className="w-full rounded-xl bg-amber-400 p-4 font-black text-slate-950 disabled:opacity-40"
          >
            <Play size={17} className="mr-2 inline" />
            Start Match
          </button>
        </section>
      )}

      {/* SECOND INNINGS SETUP */}
      {firstInningsDone && (
        <section className="space-y-4 rounded-2xl border border-amber-400/20 bg-[#142238] p-5">
          <h2 className="font-bold">Second Innings · Select Players</h2>
          <p className="text-sm text-slate-400">
            Target: {(firstInnings?.runs || 0) + 1}
          </p>

          <label className="block text-sm text-slate-300">
            Opening striker
            <select
              className={`${inputClass} mt-2`}
              value={opening.strikerId}
              onChange={(e) =>
                setOpening((p) => ({ ...p, strikerId: e.target.value }))
              }
            >
              <option value="">Select striker</option>
              {secondBattingTeam?.players.map((p) => (
                <option key={p.memberId} value={p.memberId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Non-striker
            <select
              className={`${inputClass} mt-2`}
              value={opening.nonStrikerId}
              onChange={(e) =>
                setOpening((p) => ({ ...p, nonStrikerId: e.target.value }))
              }
            >
              <option value="">Select non-striker</option>
              {secondBattingTeam?.players
                .filter((p) => String(p.memberId) !== opening.strikerId)
                .map((p) => (
                  <option key={p.memberId} value={p.memberId}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="block text-sm text-slate-300">
            Opening bowler
            <select
              className={`${inputClass} mt-2`}
              value={opening.bowlerId}
              onChange={(e) =>
                setOpening((p) => ({ ...p, bowlerId: e.target.value }))
              }
            >
              <option value="">Select bowler</option>
              {secondBowlingTeam?.players.map((p) => (
                <option key={p.memberId} value={p.memberId}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <button
            disabled={
              busy ||
              !opening.strikerId ||
              !opening.nonStrikerId ||
              !opening.bowlerId
            }
            onClick={startSecond}
            className="w-full rounded-xl bg-amber-400 p-4 font-black text-slate-950 disabled:opacity-40"
          >
            Start Second Innings
          </button>
        </section>
      )}

      {/* LIVE SCORING */}
      {isLive && (
        <>
          <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
            <h2 className="font-bold">Current Players</h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#081426] p-3">
                <p className="text-xs text-slate-400">STRIKER</p>
                <p className="font-bold">
                  {battingTeam?.players.find(
                    (p) => String(p.memberId) === String(innings.strikerId),
                  )?.name || "Not selected"}
                </p>
              </div>
              <div className="rounded-xl bg-[#081426] p-3">
                <p className="text-xs text-slate-400">NON-STRIKER</p>
                <p className="font-bold">
                  {battingTeam?.players.find(
                    (p) => String(p.memberId) === String(innings.nonStrikerId),
                  )?.name || "Not selected"}
                </p>
              </div>
            </div>

            <label className="mt-4 block text-sm text-slate-300">
              Current bowler
              <select
                className={`${inputClass} mt-2`}
                value={selectedBowlerId || innings.bowlerId || ""}
                onChange={(e) => setSelectedBowlerId(e.target.value)}
              >
                <option value="">Select bowler</option>
                {bowlingTeam?.players.map((p) => (
                  <option key={p.memberId} value={p.memberId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
            <h2 className="font-bold">Add Runs</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[0, 1, 2, 3, 4, 6].map((runs) => (
                <button
                  key={runs}
                  disabled={
                    !canScore || !(selectedBowlerId || innings.bowlerId)
                  }
                  onClick={() => score(runs)}
                  className={buttonClass}
                >
                  {runs === 0 ? "Dot" : runs}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
            <h2 className="font-bold">Extras</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                disabled={!canScore}
                onClick={() => score(0, "wide", 1)}
                className={buttonClass}
              >
                Wide +1
              </button>
              <button
                disabled={!canScore}
                onClick={() => score(0, "no_ball", 1)}
                className={buttonClass}
              >
                No Ball +1
              </button>
              <button
                disabled={!canScore}
                onClick={() => score(0, "bye", 1)}
                className={buttonClass}
              >
                Bye +1
              </button>
              <button
                disabled={!canScore}
                onClick={() => score(0, "leg_bye", 1)}
                className={buttonClass}
              >
                Leg Bye +1
              </button>
            </div>
          </section>

          {/* WICKET FORM */}
          <section className="rounded-2xl border border-red-400/20 bg-[#142238] p-5">
            <h2 className="font-bold text-red-300">Record Wicket</h2>

            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-300">
                Dismissed batter
                <select
                  className={`${inputClass} mt-2`}
                  value={wicketForm.dismissedPlayerId}
                  onChange={(e) =>
                    setWicketForm((p) => ({
                      ...p,
                      dismissedPlayerId: e.target.value,
                    }))
                  }
                >
                  <option value="">Select dismissed batter</option>
                  {[
                    { id: innings.strikerId, label: "Striker" },
                    { id: innings.nonStrikerId, label: "Non-striker" },
                  ].map((item) => {
                    const player = battingTeam?.players.find(
                      (p) => String(p.memberId) === String(item.id),
                    );
                    return player ? (
                      <option key={item.id} value={item.id}>
                        {player.name} ({item.label})
                      </option>
                    ) : null;
                  })}
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Dismissal type
                <select
                  className={`${inputClass} mt-2`}
                  value={wicketForm.dismissal}
                  onChange={(e) =>
                    setWicketForm((p) => ({
                      ...p,
                      dismissal: e.target.value,
                    }))
                  }
                >
                  {[
                    ["bowled", "Bowled"],
                    ["caught", "Caught"],
                    ["lbw", "LBW"],
                    ["stumped", "Stumped"],
                    ["hit_wicket", "Hit wicket"],
                    ["run_out", "Run out"],
                    ["retired_hurt", "Retired hurt"],
                    ["obstructing_field", "Obstructing the field"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Incoming batter
                <select
                  className={`${inputClass} mt-2`}
                  value={wicketForm.incomingPlayerId}
                  onChange={(e) =>
                    setWicketForm((p) => ({
                      ...p,
                      incomingPlayerId: e.target.value,
                    }))
                  }
                >
                  <option value="">Select incoming batter</option>
                  {availableIncomingPlayers.map((p) => (
                    <option key={p.memberId} value={p.memberId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                disabled={
                  !canScore ||
                  !wicketForm.dismissedPlayerId ||
                  !wicketForm.incomingPlayerId
                }
                onClick={recordWicket}
                className="w-full rounded-xl bg-red-500 p-4 font-black text-white disabled:opacity-40"
              >
                Confirm Wicket
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
            <h2 className="font-bold">Match Controls</h2>

            <button
              disabled={busy || !innings?.events?.length}
              onClick={undo}
              className="mt-3 w-full rounded-xl border border-white/10 p-4 font-bold disabled:opacity-40"
            >
              <Undo2 size={16} className="mr-2 inline" />
              Undo Last Ball
            </button>

            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm("Finish this innings?")) finishInnings();
              }}
              className="mt-3 w-full rounded-xl border border-amber-400/30 p-4 font-bold text-amber-300 disabled:opacity-40"
            >
              <Flag size={16} className="mr-2 inline" />
              Finish Innings
            </button>
          </section>
        </>
      )}

      {/* BATTING SCORECARD */}
      {match.innings?.map((item) => {
        const team = item.battingTeamIndex === 0 ? match.teamA : match.teamB;

        return (
          <section
            key={item.number}
            className="overflow-hidden rounded-2xl border border-white/10 bg-[#142238]"
          >
            <div className="p-4">
              <h2 className="font-bold">
                {team.name} · Innings {item.number} Batting
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {item.runs}/{item.wickets} · {oversText(item.legalBalls)} overs
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#081426] text-slate-400">
                  <tr>
                    <th className="p-3">Batter</th>
                    <th className="p-3">R</th>
                    <th className="p-3">B</th>
                    <th className="p-3">4s</th>
                    <th className="p-3">6s</th>
                    <th className="p-3">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {item.battingStats?.map((p) => (
                    <tr
                      key={String(p.playerId)}
                      className="border-t border-white/5"
                    >
                      <td className="p-3 font-semibold">
                        {p.name}
                        {p.isOut ? (
                          <span className="block text-[10px] text-slate-500">
                            {p.dismissal}
                          </span>
                        ) : (
                          <span className="text-emerald-400">*</span>
                        )}
                      </td>
                      <td className="p-3 font-bold">{p.runs}</td>
                      <td className="p-3">{p.balls}</td>
                      <td className="p-3">{p.fours}</td>
                      <td className="p-3">{p.sixes}</td>
                      <td className="p-3">{strikeRate(p.runs, p.balls)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-white/10 p-4">
              <h3 className="mb-2 text-sm font-bold">Bowling</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="p-2">Bowler</th>
                      <th className="p-2">O</th>
                      <th className="p-2">M</th>
                      <th className="p-2">R</th>
                      <th className="p-2">W</th>
                      <th className="p-2">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.bowlingStats?.map((p) => (
                      <tr
                        key={String(p.playerId)}
                        className="border-t border-white/5"
                      >
                        <td className="p-2 font-semibold">{p.name}</td>
                        <td className="p-2">{oversText(p.legalBalls)}</td>
                        <td className="p-2">{p.maidens}</td>
                        <td className="p-2">{p.runsConceded}</td>
                        <td className="p-2">{p.wickets}</td>
                        <td className="p-2">
                          {economy(p.runsConceded, p.legalBalls)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}

      {/* BALL HISTORY */}
      <section className="rounded-2xl border border-white/10 bg-[#142238] p-5">
        <h2 className="font-bold">Ball History</h2>

        {innings?.events?.length ? (
          <div className="mt-3 space-y-2">
            {[...innings.events]
              .reverse()
              .slice(0, 15)
              .map((event) => (
                <div
                  key={event._id}
                  className="flex items-center justify-between rounded-lg bg-[#081426] p-3 text-sm"
                >
                  <span className="text-slate-400">
                    Ball {event.sequence}
                    {!event.legal && " · Extra"}
                  </span>
                  <span className="font-bold">
                    {event.wicket
                      ? `WICKET · ${event.dismissal}`
                      : event.extraType !== "none"
                        ? `${event.extraType.replace("_", " ")} +${event.totalRuns}`
                        : event.runs === 0
                          ? "DOT"
                          : `${event.totalRuns} runs`}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No balls recorded yet.</p>
        )}
      </section>
    </div>
  );
}
