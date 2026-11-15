import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
export default function Auction() {
  const { user } = useAuth();
  const [state, setState] = useState(null);
  const [teamId, setTeamId] = useState("");
  const [amount, setAmount] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    api
      .get("/auction/state")
      .then((r) => setState(r.data))
      .catch(() => {});
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      { auth: { token: localStorage.getItem("sacl_token") } },
    );
    socket.on("auction:state", setState);
    socket.on("connect_error", (e) => setNotice(e.message));
    window.__saclSocket = socket;
    return () => {
      socket.disconnect();
      delete window.__saclSocket;
    };
  }, []);
  useEffect(() => {
    if (user?.role === "admin" || user?.role === "auctioneer") {
      api
        .get("/admin/applications")
        .then((r) => {
          setPlayers(
            r.data.players.filter(
              (p) =>
                p.approvalStatus === "approved" &&
                p.auctionStatus === "AVAILABLE",
            ),
          );
          setTeams(r.data.teams.filter((t) => t.approvalStatus === "approved"));
        })
        .catch(() => {});
    }
  }, [user]);
  useEffect(() => {
    if (!state?.endsAt) {
      setSeconds(0);
      return;
    }
    const tick = () =>
      setSeconds(
        Math.max(
          0,
          Math.ceil((new Date(state.endsAt).getTime() - Date.now()) / 1000),
        ),
      );
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [state?.endsAt]);
  const socket = () => window.__saclSocket;
  function emit(event, payload) {
    setNotice("");
    socket()?.emit(event, payload, (res) => {
      if (!res?.success) setNotice(res?.message || "Action failed");
      else if (event !== "auction:bid") setNotice("Auction updated");
    });
  }
  const canOperate = ["admin", "auctioneer"].includes(user?.role);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-lime">
            Live room
          </p>
          <h1 className="mt-1 text-3xl font-black">Player auction</h1>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${state?.status === "RUNNING" ? "bg-red-500/15 text-red-300" : "bg-white/10 text-emerald-100/60"}`}
        >
          {state?.status || "CONNECTING"}
        </span>
      </div>
      {notice && (
        <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
          {notice}
        </p>
      )}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="rounded-3xl border border-white/10 bg-panel p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-100/50">CURRENT PLAYER</span>
            <span className="text-sm font-bold text-lime">
              {state?.currentPlayer?.category || "—"}
            </span>
          </div>
          <div className="mt-8 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-lime/30 bg-lime/10 text-4xl">
              🏏
            </div>
            <h2 className="mt-4 text-2xl font-black">
              {state?.currentPlayer?.fullName || "Waiting for next player"}
            </h2>
            <p className="mt-1 text-sm text-emerald-100/50">
              {state?.currentPlayer?.role?.replace("_", " ") ||
                "Auction will appear here"}
            </p>
            <div className="mx-auto mt-7 max-w-sm rounded-2xl bg-pitch p-5">
              <p className="text-xs uppercase tracking-widest text-emerald-100/40">
                Highest bid
              </p>
              <p className="mt-1 text-4xl font-black text-lime">
                {(state?.currentBid || 0).toLocaleString("en-IN")}{" "}
                <span className="text-base">pts</span>
              </p>
              <p className="mt-2 text-sm text-emerald-100/50">
                {state?.highestBidTeam?.name || "No bids yet"}
              </p>
            </div>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-widest text-emerald-100/40">
                Time remaining
              </p>
              <p
                className={`mt-1 text-5xl font-black tabular-nums ${seconds <= 10 ? "text-red-400" : "text-white"}`}
              >
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                {String(seconds % 60).padStart(2, "0")}
              </p>
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-panel p-5">
            <h3 className="font-bold">Place a bid</h3>
            <label className="mt-4 block text-xs text-emerald-100/50">
              Your approved team
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="mt-2 w-full rounded-xl bg-pitch px-3 py-3 text-sm"
              >
                <option value="">Select team</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} · {t.purseRemaining} pts
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs text-emerald-100/50">
              Bid amount
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter points"
                className="mt-2 w-full rounded-xl bg-pitch px-3 py-3 text-sm"
              />
            </label>
            <button
              disabled={user?.role !== "team_owner"}
              onClick={() =>
                emit("auction:bid", { teamId, amount: Number(amount) })
              }
              className="mt-4 w-full rounded-xl bg-lime py-3 font-black text-pitch disabled:opacity-40"
            >
              Place bid
            </button>
            {user?.role !== "team_owner" && (
              <p className="mt-2 text-xs text-emerald-100/40">
                Team owner login required to bid.
              </p>
            )}
          </div>
          {canOperate && (
            <div className="rounded-2xl border border-white/10 bg-panel p-5">
              <h3 className="font-bold">Auction controls</h3>
              <select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="mt-4 w-full rounded-xl bg-pitch px-3 py-3 text-sm"
              >
                <option value="">Select approved player</option>
                {players.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.fullName} · {p.category}
                  </option>
                ))}
              </select>
              <button
                onClick={() => emit("auction:start", { playerId })}
                className="mt-3 w-full rounded-xl bg-lime py-3 font-bold text-pitch"
              >
                Start player
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => emit("auction:close", { sold: true })}
                  className="rounded-xl bg-emerald-500/20 py-3 text-sm font-bold text-emerald-300"
                >
                  Mark sold
                </button>
                <button
                  onClick={() => emit("auction:close", { sold: false })}
                  className="rounded-xl bg-red-500/15 py-3 text-sm font-bold text-red-300"
                >
                  Unsold
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
