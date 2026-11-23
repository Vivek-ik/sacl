import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";

export default function Auction() {
  const { user } = useAuth();
  const { auctionId } = useParams();

  const [search, setSearch] = useState("");
  const [state, setState] = useState(null);
  const [teamId, setTeamId] = useState("");
  const [amount, setAmount] = useState("");

  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);

  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const canOperate = [
    "super_admin",
    "admin",
    "org_admin",
    "auctioneer",
  ].includes(user?.role);

  const isTeamOwner = user?.role === "team_owner";

  const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  const currentPlayer = state?.currentPlayer;

  const formatPoints = (value) => Number(value || 0).toLocaleString("en-IN");

  const getId = (value) => {
    if (!value) return "";
    return String(value._id || value.id || value);
  };

  const selectedTeam = useMemo(
    () => teams.find((team) => getId(team) === teamId),
    [teams, teamId],
  );

  // --------------------------------------------------
  // LOAD AUCTION STATE
  // --------------------------------------------------

  const loadAuctionState = useCallback(async () => {
    if (!auctionId) return;

    try {
      const response = await api.get(`/auction/${auctionId}/state`);

      setState(response.data.auction);
    } catch (error) {
      console.error("Auction state error:", error);

      setNotice(
        error.response?.data?.message || "Unable to load auction state.",
      );
    }
  }, [auctionId]);

  // --------------------------------------------------
  // LOAD AVAILABLE PLAYERS
  // --------------------------------------------------

  const loadPlayers = useCallback(async () => {
    if (!auctionId || !canOperate) return;

    try {
      const response = await api.get(`/auction/${auctionId}/players`);

      const availablePlayers = (response.data.players || []).filter(
        (player) =>
          player.approvalStatus === "approved" &&
          player.auctionStatus === "AVAILABLE",
      );

      setPlayers(availablePlayers);
    } catch (error) {
      console.error("Player loading error:", error);

      setNotice(
        error.response?.data?.message || "Could not load available players.",
      );
    }
  }, [auctionId, canOperate]);

  // --------------------------------------------------
  // INITIAL LOAD + SOCKET CONNECTION
  // --------------------------------------------------

  useEffect(() => {
    if (!auctionId) return;

    let mounted = true;

    const socket = io(socketUrl, {
      auth: {
        token: localStorage.getItem("sacl_token"),
      },
      transports: ["websocket", "polling"],
    });

    socket.on("auction:state", (nextState) => {
      if (!mounted || !nextState) return;

      setState(nextState);
      setBidding(false);

      // When a player is closed, refresh the available player list.
      if (!nextState.currentPlayer && canOperate) {
        loadPlayers();
      }
    });

    socket.on("auction:notice", (data) => {
      if (mounted) {
        setNotice(data?.message || "");
      }
    });

    socket.on("connect_error", (error) => {
      if (mounted) {
        setNotice(`Connection error: ${error.message}`);
      }
    });

    socket.on("connect", () => {
      socket.emit("auction:join", { auctionId }, (response) => {
        if (!mounted) return;

        if (response?.success) {
          setState(response.state);
          setNotice("");
        } else {
          setNotice(response?.message || "Unable to join auction.");
        }
      });
    });

    window.__saclSocket = socket;

    Promise.all([loadAuctionState(), loadPlayers()]).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;

      socket.emit("auction:leave", { auctionId });
      socket.disconnect();

      if (window.__saclSocket === socket) {
        delete window.__saclSocket;
      }
    };
  }, [auctionId, socketUrl, canOperate, loadAuctionState, loadPlayers]);

  // --------------------------------------------------
  // LOAD TEAM OWNER'S APPROVED TEAMS
  // --------------------------------------------------

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
            getId(team.primaryOwner) === getId(user),
        );

        if (!mounted) return;

        setTeams(myApprovedTeams);

        if (myApprovedTeams.length === 1) {
          setTeamId(getId(myApprovedTeams[0]));
        }
      } catch (error) {
        console.error("My teams loading error:", error);

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
  }, [isTeamOwner, user]);

  // --------------------------------------------------
  // SYNCHRONIZED TIMER
  // --------------------------------------------------

  useEffect(() => {
    if (state?.status === "PAUSED") {
      setSeconds(Math.ceil(Number(state?.pausedRemainingMs || 0) / 1000));

      return;
    }

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
  }, [state?.endsAt, state?.status, state?.pausedRemainingMs]);

  // --------------------------------------------------
  // SOCKET EMIT HELPER
  // --------------------------------------------------

  function emit(event, payload = {}) {
    const socket = window.__saclSocket;

    if (!socket?.connected) {
      setNotice("Not connected to the live auction.");
      return;
    }

    if (event !== "auction:bid") {
      setActionLoading(true);
    }

    setNotice("");

    socket.emit(
      event,
      {
        ...payload,
        auctionId,
      },
      async (response) => {
        setActionLoading(false);
        setBidding(false);

        if (!response?.success) {
          setNotice(response?.message || "Auction action failed.");
          return;
        }

        if (response.state) {
          setState(response.state);
        }

        if (event === "auction:bid") {
          setAmount("");
          setNotice("Your bid was placed successfully.");
        } else if (event === "auction:close") {
          setNotice(
            payload.sold
              ? "Player marked as sold."
              : "Player marked as unsold.",
          );

          await loadPlayers();
        } else if (event === "auction:pause") {
          setNotice("Auction paused successfully.");
        } else if (event === "auction:resume") {
          setNotice("Auction resumed successfully.");
        } else if (event === "auction:start") {
          setNotice("Player auction started.");
        } else {
          setNotice("Auction updated successfully.");
        }
      },
    );
  }

  // --------------------------------------------------
  // PLACE BID
  // --------------------------------------------------

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

    if (bidAmount > Number(selectedTeam?.purseRemaining || 0)) {
      setNotice("Your team does not have enough points.");
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

  // --------------------------------------------------
  // START PLAYER
  // --------------------------------------------------

  function startAuction(player) {
    if (["RUNNING", "PAUSED"].includes(state?.status)) {
      setNotice("Close the current player before starting another.");
      return;
    }

    emit("auction:start", {
      playerId: player._id,
    });
  }

  // --------------------------------------------------
  // CLOSE PLAYER
  // --------------------------------------------------

  function closePlayer(sold) {
    if (!currentPlayer) {
      setNotice("There is no current player.");
      return;
    }

    if (sold && !state?.highestBidTeam) {
      setNotice("There is no highest bidder. Mark this player unsold.");
      return;
    }

    const confirmed = window.confirm(
      sold
        ? `Mark ${currentPlayer.fullName} as SOLD?`
        : `Mark ${currentPlayer.fullName} as UNSOLD?`,
    );

    if (!confirmed) return;

    emit("auction:close", { sold });
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-lime" />
      </div>
    );
  }

  const isRunning = state?.status === "RUNNING";
  const isPaused = state?.status === "PAUSED";
  const hasCurrentPlayer = Boolean(currentPlayer);

  const filteredPlayers = players.filter((player) =>
    player.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
            Live player bidding and auction control.
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-xs font-bold ${
            isRunning
              ? "bg-red-500/15 text-red-300"
              : isPaused
                ? "bg-amber-400/15 text-amber-300"
                : "bg-white/10 text-emerald-100/60"
          }`}
        >
          {isRunning
            ? "● LIVE AUCTION"
            : isPaused
              ? "⏸ AUCTION PAUSED"
              : state?.status || "WAITING"}
        </span>
      </div>

      {/* NOTICE */}
      {notice && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
          {notice}
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid gap-5 xl:grid-cols-[1fr_350px]">
        {/* CURRENT PLAYER */}
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

            {/* HIGHEST BID */}
            <div className="mx-auto mt-8 max-w-md rounded-2xl bg-pitch p-6">
              <p className="text-xs uppercase tracking-widest text-emerald-100/40">
                Highest bid
              </p>

              <p className="mt-2 text-4xl font-black text-lime">
                {formatPoints(state?.currentBid)}
                <span className="text-base"> pts</span>
              </p>

              <p className="mt-2 text-sm text-emerald-100/50">
                {state?.highestBidTeam?.name || "No bids yet"}
              </p>
            </div>

            {/* TIMER */}
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-emerald-100/40">
                Time remaining
              </p>

              <p
                className={`mt-2 text-6xl font-black tabular-nums ${
                  seconds <= 10 && isRunning
                    ? "text-red-400"
                    : isPaused
                      ? "text-amber-300"
                      : "text-white"
                }`}
              >
                00:{String(seconds).padStart(2, "0")}
              </p>

              {isRunning && (
                <p className="mt-2 text-xs text-emerald-100/40">
                  Timer resets to {state?.timerSeconds || 45} seconds after
                  every valid bid.{" "}
                </p>
              )}

              {isPaused && (
                <p className="mt-2 text-xs text-amber-300">
                  Auction is paused. Bidding is disabled.
                </p>
              )}

              {state?.status === "PAUSED" &&
                Number(state?.pausedRemainingMs || 0) <= 0 && (
                  <p className="mt-2 text-xs text-red-300">
                    Bidding time expired. Auctioneer must close this player.
                  </p>
                )}
            </div>

            {/* AUCTIONEER CONTROLS */}
            {canOperate && hasCurrentPlayer && (
              <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-pitch p-5">
                <h3 className="mb-4 text-left text-sm font-bold uppercase tracking-widest text-emerald-100/50">
                  Auction controls
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* PAUSE */}
                  {isRunning && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => emit("auction:pause")}
                      className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-bold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-40"
                    >
                      ⏸ Pause Auction
                    </button>
                  )}

                  {/* RESUME */}
                  {isPaused && Number(state?.pausedRemainingMs || 0) > 0 && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => emit("auction:resume")}
                      className="rounded-xl bg-lime px-4 py-3 font-bold text-pitch transition hover:bg-lime/80 disabled:opacity-40"
                    >
                      ▶ Resume Auction
                    </button>
                  )}

                  {/* SOLD */}
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      !state?.highestBidTeam ||
                      !["RUNNING", "PAUSED"].includes(state?.status)
                    }
                    onClick={() => closePlayer(true)}
                    className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ✓ Mark Sold
                  </button>

                  {/* UNSOLD */}
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      !["RUNNING", "PAUSED"].includes(state?.status)
                    }
                    onClick={() => closePlayer(false)}
                    className="rounded-xl bg-red-500/15 px-4 py-3 font-bold text-red-300 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ✕ Mark Unsold
                  </button>
                </div>
              </div>
            )}

            {/* NO CURRENT PLAYER */}
            {canOperate && !hasCurrentPlayer && (
              <div className="mx-auto mt-8 max-w-md rounded-xl border border-white/10 bg-pitch p-4">
                <p className="font-bold text-lime">Ready for next player</p>

                <p className="mt-1 text-sm text-emerald-100/50">
                  Select a player from the available players list. The next
                  player will not start automatically.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="space-y-4">
          {/* TEAM OWNER PANEL */}
          {isTeamOwner && (
            <div className="rounded-2xl border border-lime/20 bg-panel p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black">Your Team</h3>

                <span className="rounded-full bg-lime/10 px-3 py-1 text-xs font-bold text-lime">
                  BIDDER
                </span>
              </div>

              {teams.length > 1 && (
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-pitch px-3 py-3 text-white"
                >
                  <option value="">Select your team</option>

                  {teams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              )}

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

                  {isRunning && hasCurrentPlayer ? (
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
                          placeholder={`Minimum ${
                            Number(state?.currentBid || 0) + 1
                          }`}
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
                          actionLoading ||
                          !amount ||
                          !Number.isInteger(Number(amount)) ||
                          Number(amount) <= Number(state?.currentBid || 0) ||
                          Number(amount) >
                            Number(selectedTeam.purseRemaining || 0) ||
                          seconds <= 0
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
                      {isPaused ? (
                        <>
                          <p className="font-semibold text-amber-300">
                            Auction Paused
                          </p>

                          <p className="mt-1 text-xs text-emerald-100/40">
                            Wait for the auctioneer to resume bidding.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-amber-300">
                            Waiting for the next player
                          </p>

                          <p className="mt-1 text-xs text-emerald-100/40">
                            The auctioneer will manually start the next player.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4 rounded-xl bg-pitch p-4">
                  <p className="text-sm text-amber-300">
                    {teams.length
                      ? "Please select your approved team."
                      : "No approved team found for your account."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AVAILABLE PLAYERS */}
          {canOperate && (
            <section className="rounded-2xl border border-white/10 bg-panel p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">Available Players</h3>

                  <p className="mt-1 text-xs text-emerald-100/40">
                    Manually select the next player
                  </p>
                </div>

                <span className="rounded-full bg-lime/10 px-3 py-1 text-xs font-bold text-lime">
                  {players.length} Available
                </span>
              </div>

              <input
                type="text"
                value={search}
                placeholder="Search players..."
                className="mt-4 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 text-sm text-white"
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="mt-4 max-h-[600px] space-y-3 overflow-y-auto">
                {filteredPlayers.map((player) => (
                  <div
                    key={player._id}
                    className="rounded-xl border border-white/10 bg-pitch p-3"
                  >
                    <div className="flex items-center gap-3">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.fullName}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                          🏏
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-bold">
                          {player.fullName}
                        </h4>

                        <p className="mt-1 text-xs text-emerald-100/40">
                          {player.category} ·{" "}
                          {player.role?.replaceAll("_", " ")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={
                        actionLoading ||
                        ["RUNNING", "PAUSED"].includes(state?.status)
                      }
                      onClick={() => startAuction(player)}
                      className="mt-3 w-full rounded-lg bg-lime py-2.5 text-sm font-black text-pitch transition hover:bg-lime/80 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Start Auction
                    </button>
                  </div>
                ))}

                {filteredPlayers.length === 0 && (
                  <p className="py-8 text-center text-sm text-emerald-100/40">
                    {players.length === 0
                      ? "No available approved players."
                      : "No players match your search."}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* VIEWER INFO */}
          {!isTeamOwner && !canOperate && (
            <div className="rounded-2xl border border-white/10 bg-panel p-5">
              <h3 className="font-bold">Live auction</h3>

              <p className="mt-2 text-sm leading-relaxed text-emerald-100/50">
                You are viewing the live auction. The current player, highest
                bid, and countdown update automatically.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
