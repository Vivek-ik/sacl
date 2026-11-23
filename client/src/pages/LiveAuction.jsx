import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  Activity,
  Clock3,
  Radio,
  RefreshCw,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { api } from "../lib/api";

const SOCKET_URL = (() => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {
      // Fall through to the current site origin.
    }
  }
  return typeof window !== "undefined" ? window.location.origin : undefined;
})();

const formatPoints = (value) =>
  `${Number(value || 0).toLocaleString("en-IN")} pts`;

const formatClock = (seconds) =>
  `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")}:${String(
    Math.max(0, seconds) % 60,
  ).padStart(2, "0")}`;

const getPlayerInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "🏏";

function StatusPill({ status }) {
  const running = status === "RUNNING";
  const completed = status === "COMPLETED";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold tracking-wide ${
        running
          ? "border-red-400/30 bg-red-500/10 text-red-300"
          : completed
            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
            : "border-white/10 bg-white/[0.04] text-white/55"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          running ? "animate-pulse bg-red-400" : "bg-current"
        }`}
      />
      {running ? "LIVE NOW" : status || "WAITING"}
    </span>
  );
}

function EmptyAuction({ status }) {
  const completed = status === "COMPLETED";

  return (
    <div className="flex min-h-[390px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#0b1727] px-6 py-12 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl border border-lime-300/20 bg-lime-300/10 text-4xl">
        🏏
      </div>

      <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-lime-300">
        Public auction room
      </p>

      <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
        {completed
          ? "The auction has ended"
          : status === "PAUSED"
            ? "Auction paused"
            : "Waiting for auctioneer to start"}
      </h2>

      <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
        {completed
          ? "The auction has ended. Final results will remain visible here."
          : status === "PAUSED"
            ? "The auctioneer will resume or close the current player."
            : "The scheduled time has arrived. The auctioneer will manually start the first player. Stay here for live updates."}
      </p>
    </div>
  );
}

function ScheduledAuction({ scheduledAt }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const update = () => {
      setRemaining(
        Math.max(
          0,
          Math.ceil((new Date(scheduledAt).getTime() - Date.now()) / 1000),
        ),
      );
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [scheduledAt]);

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex min-h-[550px] flex-col items-center justify-center rounded-3xl border border-lime-300/20 bg-[#0b1727] px-5 py-12 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-3xl border border-lime-300/20 bg-lime-300/10 text-5xl">
        🏏
      </div>

      <p className="mt-7 text-xs font-black uppercase tracking-[0.3em] text-lime-300">
        SACL Public Broadcast
      </p>

      <h2 className="mt-4 text-3xl font-black sm:text-4xl">
        Auction starts soon!
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-white/50">
        The auction has been scheduled. Stay here and watch the live bidding
        when the auction begins.
      </p>

      <div className="mt-8 grid grid-cols-4 gap-3">
        {[
          ["Days", days],
          ["Hours", hours],
          ["Minutes", minutes],
          ["Seconds", seconds],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-5"
          >
            <p className="text-3xl font-black tabular-nums text-lime-300 sm:text-4xl">
              {String(value).padStart(2, "0")}
            </p>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4">
        <p className="text-xs text-white/40">Scheduled date and time</p>
        <p className="mt-2 font-bold text-white">
          {new Date(scheduledAt).toLocaleString("en-IN", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </div>

      <p className="mt-6 text-xs text-emerald-200/40">
        The auctioneer will manually start the auction.
      </p>
    </div>
  );
}

export default function LiveAuction() {
  const { auctionId } = useParams();
  const [clockNow, setClockNow] = useState(Date.now());
  const [auction, setAuction] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuction = async () => {
    try {
      setError("");
      if (!auctionId) {
        setError("Auction ID is missing from the public auction URL.");
        setLoading(false);
        return;
      }

      const { data } = await api.get(`/auction/public/${auctionId}/state`);

      setAuction(data?.auction || data?.state || data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load the live auction. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auction?.scheduledAt) return;

    const scheduledTime = new Date(auction.scheduledAt).getTime();

    if (scheduledTime <= Date.now()) return;

    const interval = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [auction?.scheduledAt]);

  useEffect(() => {
    loadAuction();

    // Public viewers connect without a login token. If a token exists, it is
    // sent optionally; server-side socket middleware must allow anonymous reads.
    const token =
      typeof window !== "undefined" ? localStorage.getItem("sacl_token") : null;
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      setConnected(true);

      socket.emit("auction:join", { auctionId }, (response) => {
        if (response?.success && response.state) {
          setAuction(response.state);
          setError("");
          setLoading(false);
        } else if (response && !response.success) {
          setError(response.message || "Unable to join public auction.");
        }
      });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("auction:state", (nextState) => {
      if (nextState) {
        setAuction(nextState?.auction || nextState?.state || nextState);
        setLoading(false);
        setError("");
      }
    });

    // Recovery path for a dropped socket or a proxy that delays socket events.
    const refreshId = window.setInterval(loadAuction, 15000);

    return () => {
      window.clearInterval(refreshId);
      socket.emit("auction:leave", { auctionId });
      socket.disconnect();
    };
  }, [auctionId]);

  useEffect(() => {
    if (auction?.status === "PAUSED") {
      setSecondsLeft(Math.ceil(Number(auction.pausedRemainingMs || 0) / 1000));
      return undefined;
    }

    if (!auction?.endsAt || auction.status !== "RUNNING") {
      setSecondsLeft(0);
      return undefined;
    }

    const updateTimer = () => {
      setSecondsLeft(
        Math.max(
          0,
          Math.ceil((new Date(auction.endsAt).getTime() - Date.now()) / 1000),
        ),
      );
    };

    updateTimer();

    const timerId = window.setInterval(updateTimer, 250);

    return () => window.clearInterval(timerId);
  }, [auction?.endsAt, auction?.status, auction?.pausedRemainingMs]);

  const player = auction?.currentPlayer;
  const bids = useMemo(
    () => [...(auction?.bids || [])].reverse(),
    [auction?.bids],
  );
  const running = auction?.status === "RUNNING";
  const paused = auction?.status === "PAUSED";

  const scheduledAt = auction?.scheduledAt
    ? new Date(auction.scheduledAt)
    : null;

  const beforeSchedule =
    scheduledAt &&
    scheduledAt.getTime() > clockNow &&
    auction?.status !== "COMPLETED";
  const timerUrgent = running && secondsLeft <= 10;

  if (loading && !auction) {
    return (
      <main className="min-h-screen bg-[#050b16] px-4 py-10 text-white">
        <div className="mx-auto max-w-7xl animate-pulse space-y-5">
          <div className="h-10 w-64 rounded-xl bg-white/10" />
          <div className="grid gap-5 lg:grid-cols-[1fr_350px]">
            <div className="h-[520px] rounded-3xl bg-white/5" />
            <div className="h-[520px] rounded-3xl bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-lime-300">
              <Radio size={15} />
              SACL • Public Broadcast
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Live Player Auction
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Watch every bid and auction update in real time. No login
              required.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60">
              {connected ? (
                <Wifi size={14} className="text-emerald-300" />
              ) : (
                <WifiOff size={14} className="text-amber-300" />
              )}
              {connected ? "Live connection" : "Reconnecting"}
            </div>
            <StatusPill status={auction?.status || "CONNECTING"} />
            <button
              type="button"
              onClick={loadAuction}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/5"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadAuction}
              className="font-bold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            {beforeSchedule ? (
              <ScheduledAuction scheduledAt={scheduledAt} />
            ) : player ? (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1727]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/45">
                    <Activity size={15} className="text-lime-300" />
                    On the auction block
                  </div>
                  <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-xs font-black text-lime-200">
                    {player.category || "PLAYER"}
                  </span>
                </div>

                <div className="grid gap-7 p-5 sm:p-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center">
                  <div className="mx-auto w-full max-w-[300px]">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#152b40] to-[#07111f]">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.fullName || "Auction player"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center">
                          <div className="grid h-32 w-32 place-items-center rounded-full border border-lime-300/20 bg-lime-300/10 text-4xl font-black text-lime-200">
                            {getPlayerInitials(player.fullName)}
                          </div>
                          <span className="mt-5 text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
                            Player profile
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-lime-200">
                          {player.category || "Registered Player"}
                        </p>
                        <p className="mt-1 text-xl font-black">
                          {player.fullName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-lime-300">
                      Current player
                    </p>
                    <h2 className="mt-3 break-words text-3xl font-black sm:text-4xl">
                      {player.fullName}
                    </h2>
                    <p className="mt-2 text-sm capitalize text-white/45">
                      {String(player.role || "Player").replaceAll("_", " ")}
                    </p>

                    <div className="mt-7 rounded-2xl border border-lime-300/15 bg-[#071321] p-5 sm:p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                        Current highest bid
                      </p>
                      <p className="mt-2 break-words text-4xl font-black tabular-nums text-lime-300 sm:text-5xl">
                        {formatPoints(auction?.currentBid)}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                        <span className="text-xs text-white/40">
                          Leading team
                        </span>
                        <span className="text-sm font-extrabold text-white">
                          {auction?.highestBidTeam?.name || "No bids yet"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
                          <Clock3 size={14} />
                          Time remaining
                        </div>
                        <p
                          className={`mt-1 text-4xl font-black tabular-nums ${
                            timerUrgent ? "text-red-400" : "text-white"
                          }`}
                        >
                          {running || paused
                            ? formatClock(secondsLeft)
                            : "--:--"}{" "}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-white/35">Auction</span>
                        <p className="mt-1 text-sm font-bold">
                          {running
                            ? "Bidding open"
                            : paused && secondsLeft > 0
                              ? "Auction paused"
                              : paused
                                ? "Bidding time expired"
                                : "Waiting for next player"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyAuction status={auction?.status} />
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0b1727] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Auction status
                </p>
                <div className="mt-2">
                  <StatusPill status={auction?.status || "WAITING"} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0b1727] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Current bid
                </p>
                <p className="mt-2 text-xl font-black text-lime-300">
                  {formatPoints(auction?.currentBid)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0b1727] p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                  Bid count
                </p>
                <p className="mt-2 text-xl font-black">
                  {auction?.bids?.length || 0}
                </p>
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b1727]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="font-black">Live bid feed</h3>
                  <p className="mt-1 text-xs text-white/40">
                    Latest bids for this player
                  </p>
                </div>
                <span className="rounded-lg bg-lime-300/10 px-2.5 py-1 text-xs font-black text-lime-200">
                  {bids.length} BIDS
                </span>
              </div>

              {bids.length ? (
                <div className="max-h-[430px] divide-y divide-white/[0.06] overflow-y-auto">
                  {bids.map((bid, index) => (
                    <div
                      key={`${bid.team?._id || bid.team?.name || "team"}-${bid.createdAt || index}-${index}`}
                      className={`flex items-center justify-between gap-3 px-5 py-4 ${
                        index === 0 ? "bg-lime-300/[0.06]" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-xs font-black text-white/60">
                          {index === 0 ? (
                            <Trophy size={15} className="text-lime-300" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {bid.team?.name || "Participating team"}
                          </p>
                          <p className="mt-1 text-[11px] text-white/35">
                            {index === 0 ? "Highest bid" : "Bid placed"}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-black text-lime-200">
                        {formatPoints(bid.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04] text-white/35">
                    <Users size={20} />
                  </div>
                  <p className="mt-3 text-sm font-bold text-white/70">
                    No bids yet
                  </p>
                  <p className="mt-1 text-xs text-white/35">
                    Bids will appear here as teams participate.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-[#0b1727] p-5">
              <div className="flex items-center gap-2 text-sm font-black">
                <Radio size={16} className="text-lime-300" />
                Public viewing
              </div>
              <p className="mt-2 text-xs leading-5 text-white/45">
                This is a read-only auction screen. Only authorized auction
                operators and team owners can perform auction actions from their
                secure dashboards.
              </p>
            </section>
          </aside>
        </div>

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-center text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <span>SACL • Live auction broadcast</span>
          <span>Keep this page open to follow real-time auction updates</span>
        </footer>
      </div>
    </main>
  );
}
