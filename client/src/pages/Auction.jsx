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
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);

  const canOperate = ["admin", "auctioneer", "org_admin"].includes(user?.role);

  const isTeamOwner = user?.role === "team_owner";

  const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  // INITIAL STATE + SOCKET CONNECTION
  useEffect(() => {
    let mounted = true;

    api
      .get("/auction/state")
      .then((response) => {
        if (mounted) setState(response.data);
      })
      .catch((error) => {
        console.error("Auction state error:", error);
        if (mounted) setNotice("Unable to load auction state.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const socket = io(socketUrl, {
      auth: {
        token: localStorage.getItem("sacl_token"),
      },
      transports: ["websocket", "polling"],
    });

    socket.on("auction:state", (nextState) => {
      if (!mounted) return;

      setState(nextState);
      setBidding(false);
    });

    socket.on("auction:notice", (data) => {
      if (mounted) setNotice(data?.message || "");
    });

    socket.on("connect_error", (error) => {
      if (mounted) setNotice(`Connection error: ${error.message}`);
    });

    socket.on("connect", () => {
      if (mounted) setNotice("");
    });

    window.__saclSocket = socket;

    return () => {
      mounted = false;
      socket.disconnect();

      if (window.__saclSocket === socket) {
        delete window.__saclSocket;
      }
    };
  }, [socketUrl]);

  // LOAD PLAYERS AND TEAMS FOR AUCTION OPERATORS
  useEffect(() => {
    if (!canOperate) return;

    api
      .get("/admin/applications")
      .then((response) => {
        const availablePlayers = (response.data.players || []).filter(
          (player) =>
            player.approvalStatus === "approved" &&
            player.auctionStatus === "AVAILABLE",
        );

        const approvedTeams = (response.data.teams || []).filter(
          (team) => team.approvalStatus === "approved",
        );

        setPlayers(availablePlayers);
        setTeams(approvedTeams);
      })
      .catch((error) => {
        console.error("Auction applications error:", error);
        setNotice(
          error.response?.data?.message || "Could not load auction players.",
        );
      });
  }, [canOperate]);

  // LOAD TEAM OWNER'S OWN APPROVED TEAMS
  // LOAD ONLY THE LOGGED-IN TEAM OWNER'S APPROVED TEAMS
  useEffect(() => {
    if (!isTeamOwner) return;

    let mounted = true;

    async function loadMyTeams() {
      try {
        const response = await api.get("/registrations/me");

        const data = response.data;

        const registeredTeams = Array.isArray(data.teams)
          ? data.teams
          : data.team
            ? [data.team]
            : [];

        const myApprovedTeams = registeredTeams.filter(
          (team) =>
            team.approvalStatus === "approved" &&
            team.primaryOwner === user?.id,
        );

        if (!mounted) return;

        setTeams(myApprovedTeams);

        // Automatically select the owner's team if there is only one.
        if (myApprovedTeams.length === 1) {
          setTeamId(myApprovedTeams[0]._id);
        }
      } catch (error) {
        console.error("My team loading error:", error);

        if (mounted) {
          setNotice(
            error.response?.data?.message ||
              "Could not load your approved team.",
          );
        }
      }
    }

    loadMyTeams();

    return () => {
      mounted = false;
    };
  }, [isTeamOwner, user?.id]);

  // SYNCHRONIZED COUNTDOWN FROM SERVER endsAt
  useEffect(() => {
    if (!state?.endsAt || state?.status !== "RUNNING") {
      setSeconds(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(state.endsAt).getTime() - Date.now()) / 1000),
      );

      setSeconds(remaining);
    };

    tick();

    const intervalId = setInterval(tick, 250);

    return () => clearInterval(intervalId);
  }, [state?.endsAt, state?.status]);

  const currentPlayer = state?.currentPlayer;

  const selectedTeam = useMemo(
    () => teams.find((team) => team._id === teamId),
    [teams, teamId],
  );

  function emit(event, payload) {
    const socket = window.__saclSocket;

    if (!socket?.connected) {
      setNotice("Not connected to the live auction. Please wait.");
      return;
    }

    setNotice("");

    socket.emit(event, payload, (response) => {
      if (!response?.success) {
        setBidding(false);
        setNotice(response?.message || "Auction action failed.");
        return;
      }

      if (event === "auction:bid") {
        setAmount("");
        setNotice("Your bid was placed successfully.");
      } else {
        setNotice("Auction updated successfully.");
      }
    });
  }

  function placeBid() {
    const bidAmount = Number(amount);

    if (!teamId) {
      setNotice("Please select your approved team.");
      return;
    }

    if (!Number.isInteger(bidAmount) || bidAmount <= 0) {
      setNotice("Enter a valid whole-number bid.");
      return;
    }

    if (bidAmount <= Number(state?.currentBid || 0)) {
      setNotice("Your bid must be higher than the current highest bid.");
      return;
    }

    if (seconds <= 0 || state?.status !== "RUNNING") {
      setNotice("The bidding period has ended.");
      return;
    }

    setBidding(true);

    emit("auction:bid", {
      teamId,
      amount: bidAmount,
    });
  }

  const formatPoints = (value) => Number(value || 0).toLocaleString("en-IN");

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-lime" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-lime">
            Live room
          </p>

          <h1 className="mt-1 text-3xl font-black">Player Auction</h1>

          <p className="mt-2 text-sm text-emerald-100/50">
            Watch live bids and follow every player auction in real time.
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-xs font-bold ${
            state?.status === "RUNNING"
              ? "bg-red-500/15 text-red-300"
              : "bg-white/10 text-emerald-100/60"
          }`}
        >
          {state?.status === "RUNNING"
            ? "● LIVE AUCTION"
            : state?.status || "WAITING"}
        </span>
      </div>

      {notice && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
          {notice}
        </div>
      )}

      {/* MAIN AUCTION */}
      <div className="grid gap-5 xl:grid-cols-[1fr_350px]">
        <section className="rounded-3xl border border-white/10 bg-panel p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold tracking-widest text-emerald-100/50">
              CURRENT PLAYER
            </span>

            <span className="rounded-full bg-lime/10 px-3 py-1 text-xs font-bold text-lime">
              {currentPlayer?.category || "—"}
            </span>
          </div>

          <div className="mt-8 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-lime/30 bg-lime/10 text-4xl">
              🏏
            </div>

            <h2 className="mt-5 text-3xl font-black">
              {currentPlayer?.fullName || "Waiting for next player"}
            </h2>

            <p className="mt-2 text-sm text-emerald-100/50">
              {currentPlayer?.role
                ? currentPlayer.role.replaceAll("_", " ")
                : "The next player will appear here"}
            </p>

            <div className="mx-auto mt-8 max-w-md rounded-2xl bg-pitch p-6">
              <p className="text-xs uppercase tracking-widest text-emerald-100/40">
                Highest bid
              </p>

              <p className="mt-2 text-4xl font-black text-lime">
                {formatPoints(state?.currentBid)}{" "}
                <span className="text-base">pts</span>
              </p>

              <p className="mt-2 text-sm text-emerald-100/50">
                {state?.highestBidTeam?.name || "No bids yet"}
              </p>
            </div>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-emerald-100/40">
                Time remaining
              </p>

              <p
                className={`mt-2 text-6xl font-black tabular-nums ${
                  seconds <= 10 && state?.status === "RUNNING"
                    ? "text-red-400"
                    : "text-white"
                }`}
              >
                00:{String(seconds).padStart(2, "0")}
              </p>

              {state?.status === "RUNNING" && (
                <p className="mt-2 text-xs text-emerald-100/40">
                  The timer resets to 45 seconds after every valid bid.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="space-y-4">
          {/* TEAM OWNER BIDDING PANEL */}
          {isTeamOwner && (
            <div className="rounded-2xl border border-lime/20 bg-panel p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black">Your Team</h3>
                <span className="rounded-full bg-lime/10 px-3 py-1 text-xs font-bold text-lime">
                  BIDDER
                </span>
              </div>

              {selectedTeam ? (
                <>
                  <div className="mt-4 rounded-xl bg-pitch p-4">
                    <p className="text-xs text-emerald-100/50">Bidding as</p>
                    <h4 className="mt-1 text-xl font-black text-white">
                      {selectedTeam.name}
                    </h4>

                    <p className="mt-4 text-xs text-emerald-100/50">
                      Remaining purse
                    </p>
                    <p className="mt-1 text-2xl font-black text-lime">
                      {formatPoints(selectedTeam.purseRemaining)} pts
                    </p>
                  </div>

                  {state?.status === "RUNNING" && currentPlayer ? (
                    <>
                      <div className="mt-5">
                        <label className="text-xs font-semibold text-emerald-100/60">
                          Enter your bid (points)
                        </label>

                        <input
                          type="number"
                          min={Number(state?.currentBid || 0) + 1}
                          step="1"
                          value={amount}
                          onChange={(event) => setAmount(event.target.value)}
                          placeholder={`Minimum ${Number(state?.currentBid || 0) + 1}`}
                          disabled={bidding || seconds <= 0}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-pitch px-4 py-4 text-lg font-bold text-white outline-none focus:border-lime disabled:opacity-50"
                        />

                        <p className="mt-2 text-xs text-emerald-100/40">
                          Current highest bid: {formatPoints(state?.currentBid)}{" "}
                          pts
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          bidding ||
                          !amount ||
                          !Number.isInteger(Number(amount)) ||
                          Number(amount) <= Number(state?.currentBid || 0) ||
                          Number(amount) >
                            Number(selectedTeam.purseRemaining || 0) ||
                          seconds <= 0 ||
                          state?.status !== "RUNNING"
                        }
                        onClick={placeBid}
                        className="mt-4 w-full rounded-xl bg-lime py-4 text-base font-black text-pitch transition hover:bg-lime/80 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {bidding ? "Placing Bid..." : "PLACE BID"}
                      </button>

                      <p className="mt-3 text-center text-xs text-emerald-100/40">
                        Your bid must exceed the current highest bid.
                      </p>
                    </>
                  ) : (
                    <div className="mt-5 rounded-xl border border-white/10 bg-pitch p-4 text-center">
                      <p className="font-semibold text-amber-300">
                        Waiting for the next player
                      </p>
                      <p className="mt-1 text-xs text-emerald-100/40">
                        Bidding will become available when the auction conductor
                        starts a player.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4 rounded-xl bg-pitch p-4">
                  <p className="text-sm text-amber-300">
                    No approved team found for your account.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AUCTION CONTROLS */}
          {canOperate && (
            <div className="rounded-2xl border border-white/10 bg-panel p-5">
              <h3 className="font-bold">Auction controls</h3>

              <label className="mt-4 block text-xs text-emerald-100/50">
                Select approved player
                <select
                  value={playerId}
                  onChange={(event) => setPlayerId(event.target.value)}
                  disabled={state?.status === "RUNNING"}
                  className="mt-2 w-full rounded-xl bg-pitch px-3 py-3 text-sm text-white disabled:opacity-50"
                >
                  <option value="">Select player</option>

                  {players.map((player) => (
                    <option key={player._id} value={player._id}>
                      {player.fullName} · {player.category}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                disabled={!playerId || state?.status === "RUNNING"}
                onClick={() => emit("auction:start", { playerId })}
                className="mt-4 w-full rounded-xl bg-lime py-3 font-bold text-pitch disabled:opacity-40"
              >
                {/* Start Player (45 sec) */}
                Start Player
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={state?.status !== "RUNNING"}
                  onClick={() => emit("auction:close", { sold: true })}
                  className="rounded-xl bg-emerald-500/20 py-3 text-sm font-bold text-emerald-300 disabled:opacity-40"
                >
                  Mark Sold
                </button>

                <button
                  type="button"
                  disabled={state?.status !== "RUNNING"}
                  onClick={() => emit("auction:close", { sold: false })}
                  className="rounded-xl bg-red-500/15 py-3 text-sm font-bold text-red-300 disabled:opacity-40"
                >
                  Unsold
                </button>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-emerald-100/40">
                When the 45-second timer expires, the server automatically
                closes the lot and starts the next available player.
              </p>
            </div>
          )}

          {/* VIEWER INFO */}
          {!isTeamOwner && !canOperate && (
            <div className="rounded-2xl border border-white/10 bg-panel p-5">
              <h3 className="font-bold">Live auction</h3>

              <p className="mt-2 text-sm leading-relaxed text-emerald-100/50">
                You are viewing the live auction. The current player, highest
                bid, winning team, and countdown update automatically.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
