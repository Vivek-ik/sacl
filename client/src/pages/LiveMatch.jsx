import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Radio, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { getSocket } from "../lib/socket";
const overs = (b) => `${Math.floor((b || 0) / 6)}.${(b || 0) % 6}`;
const pname = (p) => p?.fullName || p?.name || "—";
export default function LiveMatch() {
  const { matchId } = useParams();
  const [data, setData] = useState(null),
    [error, setError] = useState("");

    console.log("data",data);
    


useEffect(() => {
  let active = true;
  const socket = getSocket();

  // Fetch match immediately, without waiting for Socket.IO
  const loadMatch = async () => {
    try {
      console.log("Fetching match:", matchId);

      const response = await api.get(`/public/matches/${matchId}`);

      console.log("Match API response:", response.data);

      if (active) {
        setData(response.data);
        setError("");
      }
    } catch (e) {
      console.error("Match API error:", e.response?.data || e);

      if (active) {
        setError(
          e.response?.data?.message || "Unable to load match"
        );
      }
    }
  };

  // Join room whenever socket connects
  const joinMatch = () => {
    console.log("Socket connected. Joining match:", matchId);
    socket.emit("match:join", matchId);
  };

  const update = (payload) => {
    const eventMatchId =
      typeof payload?.match === "object"
        ? payload.match?._id
        : payload?.match;

    if (String(eventMatchId) === String(matchId)) {
      console.log("Live score update:", payload);
      setData(payload);
      setError("");
    }
  };

  // Register listeners
  socket.on("connect", joinMatch);
  socket.on("score:update", update);

  // Fetch immediately
  loadMatch();

  // Connect socket if it isn't already connected
  if (socket.connected) {
    joinMatch();
  } else {
    socket.connect();
  }

  return () => {
    active = false;

    socket.off("connect", joinMatch);
    socket.off("score:update", update);
    socket.emit("match:leave", matchId);
  };
}, [matchId]);

  if (error) return <p className="p-5 text-red-300">{error}</p>;
  if (!data)
    return (
      <div className="grid min-h-64 place-items-center">
        <RefreshCw className="animate-spin text-lime" />
      </div>
    );
  const { match, innings = [], recentDeliveries = [] } = data;
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        to="/live"
        className="inline-flex items-center gap-2 text-sm text-emerald-100/60"
      >
        <ArrowLeft size={16} /> All matches
      </Link>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
        <div className="bg-[#0b211a] p-5 sm:p-7">
          <div className="flex justify-between gap-2">
            <p className="text-xs text-emerald-100/50">{match.title}</p>
            <span className="text-xs font-bold uppercase text-lime">
              <Radio className="mr-1 inline" size={12} />
              {match.status}
            </span>
          </div>
          <h1 className="mt-3 text-xl font-black sm:text-3xl">
            {pname(match.teamA)} vs {pname(match.teamB)}
          </h1>
          <p className="mt-1 text-xs text-emerald-100/50">
            {match.oversPerInnings} overs per innings
          </p>
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          {innings.map((i) => (
            <section
              key={i._id}
              className="rounded-xl border border-white/10 bg-pitch p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <b>
                  {pname(i.battingTeam)}{" "}
                  <small className="font-normal text-emerald-100/40">
                    Innings {i.number}
                  </small>
                </b>
                <span className="text-xs text-emerald-100/50">{i.status}</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-4xl font-black tabular-nums">
                  {i.totalRuns}/{i.wickets}
                </p>
                <p className="text-sm text-emerald-100/50">
                  {overs(i.legalBalls)} overs
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white/5 p-3 text-sm">
                  <p className="text-xs text-emerald-100/40">BATTING</p>
                  {i.battingStats?.map((s) => (
                    <p
                      key={s.player?._id || s.player}
                      className="mt-2 flex justify-between gap-2"
                    >
                      <span>
                        {pname(s.player)} {s.isOut ? "" : "*"}
                      </span>
                      <b>
                        {s.runs} ({s.balls})
                      </b>
                    </p>
                  ))}
                </div>
                <div className="rounded-lg bg-white/5 p-3 text-sm">
                  <p className="text-xs text-emerald-100/40">BOWLING</p>
                  {i.bowlingStats?.map((s) => (
                    <p
                      key={s.player?._id || s.player}
                      className="mt-2 flex justify-between gap-2"
                    >
                      <span>{pname(s.player)}</span>
                      <b>
                        {s.wickets}/{s.runsConceded} · {overs(s.legalBalls)}
                      </b>
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-panel p-4">
        <h2 className="font-bold">Recent deliveries</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {recentDeliveries.map((d) => (
            <span key={d._id} className="rounded-lg bg-pitch px-3 py-2 text-xs">
              {d.overNumber}.{d.ballInOver} · {d.totalRuns} run(s){" "}
              {d.wicket?.kind ? `· ${d.wicket.kind}` : ""}
            </span>
          ))}
          {!recentDeliveries.length && (
            <p className="text-sm text-emerald-100/40">
              No deliveries recorded yet.
            </p>
          )}
        </div>
      </section>
      {match.result && (
        <p className="rounded-xl border border-lime/20 bg-lime/5 p-4 font-bold text-lime">
          {match.result}
        </p>
      )}
    </div>
  );
}
