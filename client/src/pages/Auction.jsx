import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";

const FORMAT_LABELS = {
  LIVE_BIDDING: "Live Open Bidding",
  SNAKE_DRAFT: "Snake Draft",
  DIRECT_SELECTION: "Direct Selection",
};

const formatPoints = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getId = (value) => {
  if (!value) return "";
  return String(value._id || value.id || value);
};

const getError = (error, fallback) => error.response?.data?.message || fallback;

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

  const [formatState, setFormatState] = useState(null);
  const [formatLoading, setFormatLoading] = useState(false);

  const canOperate = [
    "super_admin",
    "admin",
    "org_admin",
    "auctioneer",
  ].includes(user?.role);

  const isTeamOwner = user?.role === "team_owner";

  const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

  const currentPlayer = state?.currentPlayer;

  const auctionFormat = state?.auctionFormat || "LIVE_BIDDING";

  const selectionPrice = Number(state?.selectionPrice ?? 500);

  const selectedTeam = useMemo(
    () => teams.find((team) => getId(team) === teamId),
    [teams, teamId],
  );

  const currentTeam = formatState?.currentTeam || null;

  const currentTeamId = getId(currentTeam);

  const isMyDraftTurn =
    auctionFormat !== "SNAKE_DRAFT" ||
    (Boolean(teamId) && currentTeamId === teamId);

  const draftCompleted = Boolean(formatState?.auction?.draft?.completed);

  const isRunning = state?.status === "RUNNING";
  const isPaused = state?.status === "PAUSED";
  const hasCurrentPlayer = Boolean(currentPlayer);

  const filteredPlayers = useMemo(
    () =>
      players.filter((player) =>
        player.fullName?.toLowerCase().includes(search.toLowerCase()),
      ),
    [players, search],
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

      setNotice(getError(error, "Unable to load auction state."));
    }
  }, [auctionId]);

  // --------------------------------------------------
  // LOAD AVAILABLE PLAYERS
  // --------------------------------------------------

  const loadPlayers = useCallback(async () => {
    if (!auctionId) return;

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

      setNotice(getError(error, "Could not load available players."));
    }
  }, [auctionId]);

  // --------------------------------------------------
  // LOAD TEAM OWNER'S APPROVED TEAMS
  // --------------------------------------------------

  const loadMyTeams = useCallback(async () => {
    if (!isTeamOwner) return;

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

      setTeams(myApprovedTeams);

      setTeamId((current) => {
        if (
          current &&
          myApprovedTeams.some((team) => getId(team) === current)
        ) {
          return current;
        }

        return myApprovedTeams.length === 1 ? getId(myApprovedTeams[0]) : "";
      });
    } catch (error) {
      console.error("My teams loading error:", error);

      setNotice(getError(error, "Could not load your approved team."));
    }
  }, [isTeamOwner, user]);

  // --------------------------------------------------
  // LOAD FORMAT STATE
  // --------------------------------------------------

  const loadFormatState = useCallback(async () => {
    if (!auctionId || !state?.auctionFormat) return;

    if (!["SNAKE_DRAFT", "DIRECT_SELECTION"].includes(state.auctionFormat)) {
      setFormatState(null);
      return;
    }

    setFormatLoading(true);

    try {
      const endpoint =
        state.auctionFormat === "SNAKE_DRAFT"
          ? `/auction-formats/${auctionId}/draft`
          : `/auction-formats/${auctionId}/direct`;

      const response = await api.get(endpoint);

      setFormatState(response.data);
    } catch (error) {
      setNotice(getError(error, "Unable to load selection information."));
    } finally {
      setFormatLoading(false);
    }
  }, [auctionId, state?.auctionFormat]);

  useEffect(() => {
    loadFormatState();
  }, [loadFormatState]);

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

      if (!nextState.currentPlayer) {
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

    Promise.all([loadAuctionState(), loadPlayers(), loadMyTeams()]).finally(
      () => {
        if (mounted) setLoading(false);
      },
    );

    return () => {
      mounted = false;

      socket.emit("auction:leave", { auctionId });
      socket.disconnect();

      if (window.__saclSocket === socket) {
        delete window.__saclSocket;
      }
    };
  }, [auctionId, socketUrl, loadAuctionState, loadPlayers, loadMyTeams]);

  // --------------------------------------------------
  // REFRESH FORMAT STATE AFTER SOCKET UPDATES
  // --------------------------------------------------

  useEffect(() => {
    if (!state?.auctionFormat) return;

    if (["SNAKE_DRAFT", "DIRECT_SELECTION"].includes(state.auctionFormat)) {
      loadFormatState();
    }
  }, [state?.updatedAt, state?.auctionFormat, loadFormatState]);

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
  // SNAKE DRAFT INITIALIZATION
  // --------------------------------------------------

  async function initializeDraft() {
    try {
      setActionLoading(true);
      setNotice("");

      const response = await api.post(
        `/auction-formats/${auctionId}/draft/initialize`,
      );

      setFormatState(response.data);

      setNotice("Snake Draft initialized successfully.");
    } catch (error) {
      setNotice(getError(error, "Could not initialize Snake Draft."));
    } finally {
      setActionLoading(false);
    }
  }

  // --------------------------------------------------
  // PLAYER SELECTION
  // --------------------------------------------------

  async function selectPlayer(player) {
    if (!teamId) {
      setNotice("Please select your approved team.");
      return;
    }

    if (!selectedTeam) {
      setNotice("Your selected team could not be found.");
      return;
    }

    if (auctionFormat === "SNAKE_DRAFT" && !isMyDraftTurn) {
      setNotice("It is not your team's turn.");
      return;
    }

    if (
      auctionFormat === "SNAKE_DRAFT" &&
      !formatState?.auction?.draft?.initialized
    ) {
      setNotice("The auctioneer must initialize the draft first.");
      return;
    }

    if (draftCompleted) {
      setNotice("The Snake Draft has been completed.");
      return;
    }

    if (Number(selectedTeam.purseRemaining || 0) < selectionPrice) {
      setNotice("Your team does not have enough purse.");
      return;
    }

    if (
      (selectedTeam.squad || []).length >=
      Number(state?.tournament?.squadSize || 13)
    ) {
      setNotice("Your team squad is already full.");
      return;
    }

    const confirmed = window.confirm(
      `Select ${player.fullName} for ${formatPoints(selectionPrice)}? This amount will be deducted from ${selectedTeam.name}'s purse.`,
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setNotice("");

      const endpoint =
        auctionFormat === "SNAKE_DRAFT"
          ? `/auction-formats/${auctionId}/draft/pick`
          : `/auction-formats/${auctionId}/direct/select`;

      const response = await api.post(endpoint, {
        teamId,
        playerId: player._id,
      });

      setFormatState(response.data);

      setNotice(
        `${player.fullName} selected successfully. ${formatPoints(selectionPrice)} deducted from your team's purse.`,
      );

      await Promise.all([loadPlayers(), loadMyTeams(), loadAuctionState()]);
    } catch (error) {
      setNotice(getError(error, "Unable to select this player."));
    } finally {
      setActionLoading(false);
    }
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

  // --------------------------------------------------
  // FORMAT DATA
  // --------------------------------------------------

  const draft = formatState?.auction?.draft;

  const draftPicks = draft?.picks || [];

  const directSelections = formatState?.auction?.directSelections || [];

  const selectionHistory =
    auctionFormat === "SNAKE_DRAFT" ? draftPicks : directSelections;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="space-y-6 text-white">
      {/* HEADER */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-lime">
            Tournament auction room
          </p>

          <h1 className="mt-1 text-3xl font-black">
            {FORMAT_LABELS[auctionFormat] || "Player Auction"}
          </h1>

          <p className="mt-2 text-sm text-emerald-100/50">
            {auctionFormat === "LIVE_BIDDING"
              ? "Live player bidding and auction control."
              : auctionFormat === "SNAKE_DRAFT"
                ? "Teams select players in snake draft order."
                : "Teams directly select available players."}
          </p>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-xs font-bold ${
            auctionFormat !== "LIVE_BIDDING"
              ? "bg-lime/10 text-lime"
              : isRunning
                ? "bg-red-500/15 text-red-300"
                : isPaused
                  ? "bg-amber-400/15 text-amber-300"
                  : "bg-white/10 text-emerald-100/60"
          }`}
        >
          {auctionFormat !== "LIVE_BIDDING"
            ? FORMAT_LABELS[auctionFormat]
            : isRunning
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

      {/* TEAM OWNER PANEL */}

      {isTeamOwner && (
        <section className="rounded-2xl border border-lime/20 bg-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Your Team</h2>
              <p className="mt-1 text-xs text-emerald-100/40">
                Select the approved team you are representing.
              </p>
            </div>

            <span className="rounded-full bg-lime/10 px-3 py-1 text-xs font-bold text-lime">
              TEAM OWNER
            </span>
          </div>

          {teams.length > 1 && (
            <select
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
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
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-pitch p-4">
                <p className="text-xs text-emerald-100/50">Team</p>

                <p className="mt-1 font-black">{selectedTeam.name}</p>
              </div>

              <div className="rounded-xl bg-pitch p-4">
                <p className="text-xs text-emerald-100/50">Remaining purse</p>

                <p className="mt-1 text-xl font-black text-lime">
                  {formatPoints(selectedTeam.purseRemaining)}
                </p>
              </div>

              <div className="rounded-xl bg-pitch p-4">
                <p className="text-xs text-emerald-100/50">Squad size</p>

                <p className="mt-1 text-xl font-black">
                  {(selectedTeam.squad || []).length}
                  <span className="text-sm text-white/40">
                    {" "}
                    / {state?.tournament?.squadSize || 13}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-pitch p-4 text-sm text-amber-300">
              {teams.length
                ? "Please select your approved team."
                : "No approved team found for your account."}
            </p>
          )}
        </section>
      )}

      {/* LIVE OPEN BIDDING */}

      {auctionFormat === "LIVE_BIDDING" && (
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
              <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-lime/30 bg-lime/10 text-4xl">
                {currentPlayer?.photo ? (
                  <img
                    src={currentPlayer.photo}
                    alt={currentPlayer.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "🏏"
                )}
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
                    every valid bid.
                  </p>
                )}

                {isPaused && (
                  <p className="mt-2 text-xs text-amber-300">
                    Auction is paused. Bidding is disabled.
                  </p>
                )}

                {isPaused && Number(state?.pausedRemainingMs || 0) <= 0 && (
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
                    {isRunning && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => emit("auction:pause")}
                        className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 font-bold text-amber-300 disabled:opacity-40"
                      >
                        ⏸ Pause Auction
                      </button>
                    )}

                    {isPaused && Number(state?.pausedRemainingMs || 0) > 0 && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => emit("auction:resume")}
                        className="rounded-xl bg-lime px-4 py-3 font-bold text-pitch disabled:opacity-40"
                      >
                        ▶ Resume Auction
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={
                        actionLoading ||
                        !state?.highestBidTeam ||
                        !["RUNNING", "PAUSED"].includes(state?.status)
                      }
                      onClick={() => closePlayer(true)}
                      className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-40"
                    >
                      ✓ Mark Sold
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionLoading ||
                        !["RUNNING", "PAUSED"].includes(state?.status)
                      }
                      onClick={() => closePlayer(false)}
                      className="rounded-xl bg-red-500/15 px-4 py-3 font-bold text-red-300 disabled:opacity-40"
                    >
                      ✕ Mark Unsold
                    </button>
                  </div>
                </div>
              )}

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
            {/* TEAM OWNER BIDDING */}

            {isTeamOwner && selectedTeam && (
              <div className="rounded-2xl border border-lime/20 bg-panel p-5">
                {isRunning && hasCurrentPlayer ? (
                  <>
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
                      className="mt-4 w-full rounded-xl bg-lime py-4 text-base font-black text-pitch disabled:opacity-40"
                    >
                      {bidding ? "Placing Bid..." : "PLACE BID"}
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-amber-300">
                    Waiting for the auctioneer to start the next player.
                  </p>
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
                  onChange={(event) => setSearch(event.target.value)}
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
                        className="mt-3 w-full rounded-lg bg-lime py-2.5 text-sm font-black text-pitch disabled:cursor-not-allowed disabled:opacity-40"
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
          </aside>
        </div>
      )}

      {/* SNAKE DRAFT AND DIRECT SELECTION */}

      {["SNAKE_DRAFT", "DIRECT_SELECTION"].includes(auctionFormat) && (
        <div className="grid gap-5 xl:grid-cols-[1fr_350px]">
          <section className="space-y-5">
            {/* FORMAT STATUS */}

            <div className="rounded-3xl border border-lime/20 bg-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-lime">
                    {FORMAT_LABELS[auctionFormat]}
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    {auctionFormat === "SNAKE_DRAFT"
                      ? draftCompleted
                        ? "Draft Completed"
                        : "Player Draft"
                      : "Player Selection"}
                  </h2>

                  <p className="mt-2 text-sm text-emerald-100/50">
                    Each player selection costs{" "}
                    <strong className="text-lime">
                      {formatPoints(selectionPrice)}
                    </strong>
                    .
                  </p>
                </div>

                <div className="rounded-xl bg-lime/10 p-4">
                  <p className="text-xs text-emerald-100/50">Selection price</p>

                  <p className="mt-1 text-2xl font-black text-lime">
                    {formatPoints(selectionPrice)}
                  </p>
                </div>
              </div>

              {auctionFormat === "SNAKE_DRAFT" && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-pitch p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-emerald-100/40">
                        Current team turn
                      </p>

                      <h3 className="mt-2 text-2xl font-black text-lime">
                        {formatState?.currentTeam?.name ||
                          "Waiting for draft initialization"}
                      </h3>
                    </div>

                    {canOperate && !draft?.initialized && (
                      <button
                        type="button"
                        disabled={actionLoading || formatLoading}
                        onClick={initializeDraft}
                        className="rounded-xl bg-lime px-5 py-3 font-black text-pitch disabled:opacity-40"
                      >
                        {actionLoading ? "Initializing..." : "Initialize Draft"}
                      </button>
                    )}
                  </div>

                  {draft?.initialized && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-xs text-emerald-100/40">
                          Current round
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {draft.currentRound}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/5 p-3">
                        <p className="text-xs text-emerald-100/40">
                          Total picks
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {draftPicks.length}
                        </p>
                      </div>
                    </div>
                  )}

                  {draftCompleted && (
                    <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">
                      Snake Draft has been completed.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* PLAYER LIST */}

            <div className="rounded-2xl border border-white/10 bg-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">Available Players</h3>

                  <p className="mt-1 text-xs text-emerald-100/40">
                    Select a player to add to your squad.
                  </p>
                </div>

                <span className="rounded-full bg-lime/10 px-3 py-1 text-xs font-bold text-lime">
                  {players.length} Available
                </span>
              </div>

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search players..."
                className="mt-4 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3 text-sm outline-none focus:border-lime"
              />

              {!isTeamOwner && (
                <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-200">
                  You can view available players. Only an approved team owner
                  can make a selection.
                </p>
              )}

              {isTeamOwner && auctionFormat === "SNAKE_DRAFT" && (
                <p className="mt-4 rounded-xl bg-lime/10 p-3 text-xs text-lime">
                  {draft?.initialized
                    ? isMyDraftTurn
                      ? "It is your team's turn. You can select a player."
                      : `Waiting for ${formatState?.currentTeam?.name || "the current team"} to make its pick.`
                    : "Waiting for the auctioneer to initialize the draft."}
                </p>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {filteredPlayers.map((player) => {
                  const enoughPurse =
                    Number(selectedTeam?.purseRemaining || 0) >= selectionPrice;

                  const canSelect =
                    isTeamOwner &&
                    Boolean(selectedTeam) &&
                    (auctionFormat !== "SNAKE_DRAFT" ||
                      (draft?.initialized &&
                        isMyDraftTurn &&
                        !draftCompleted)) &&
                    enoughPurse &&
                    !actionLoading &&
                    !formatLoading;

                  return (
                    <div
                      key={player._id}
                      className="rounded-xl border border-white/10 bg-pitch p-4"
                    >
                      <div className="flex items-center gap-3">
                        {player.photo ? (
                          <img
                            src={player.photo}
                            alt={player.fullName}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="grid h-14 w-14 place-items-center rounded-xl bg-white/10 text-2xl">
                            🏏
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="truncate font-bold">
                            {player.fullName}
                          </h4>

                          <p className="mt-1 text-xs text-emerald-100/40">
                            {player.category} ·{" "}
                            {player.role?.replaceAll("_", " ")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-emerald-100/40">
                          Selection price
                        </span>

                        <span className="font-black text-lime">
                          {formatPoints(selectionPrice)}
                        </span>
                      </div>

                      {isTeamOwner && (
                        <button
                          type="button"
                          disabled={!canSelect}
                          onClick={() => selectPlayer(player)}
                          className="mt-4 w-full rounded-lg bg-lime py-3 text-sm font-black text-pitch disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {actionLoading
                            ? "Processing..."
                            : !selectedTeam
                              ? "Select Your Team"
                              : auctionFormat === "SNAKE_DRAFT" &&
                                  !draft?.initialized
                                ? "Draft Not Started"
                                : auctionFormat === "SNAKE_DRAFT" &&
                                    !isMyDraftTurn
                                  ? "Not Your Turn"
                                  : !enoughPurse
                                    ? "Insufficient Purse"
                                    : draftCompleted
                                      ? "Draft Completed"
                                      : `Select Player · ${formatPoints(selectionPrice)}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredPlayers.length === 0 && (
                <p className="py-10 text-center text-sm text-emerald-100/40">
                  No available players found.
                </p>
              )}
            </div>
          </section>

          {/* RIGHT SIDE */}

          <aside className="space-y-5">
            {isTeamOwner && (
              <section className="rounded-2xl border border-lime/20 bg-panel p-5">
                <h3 className="text-lg font-black">Team Purse</h3>

                {selectedTeam ? (
                  <>
                    <p className="mt-4 text-xs text-emerald-100/40">
                      Remaining purse
                    </p>

                    <p className="mt-1 text-3xl font-black text-lime">
                      {formatPoints(selectedTeam.purseRemaining)}
                    </p>

                    <div className="mt-5 rounded-xl bg-pitch p-4">
                      <p className="text-xs text-emerald-100/40">
                        Cost per player
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {formatPoints(selectionPrice)}
                      </p>

                      <p className="mt-3 text-xs text-emerald-100/40">
                        Players in squad
                      </p>

                      <p className="mt-1 font-bold">
                        {(selectedTeam.squad || []).length} /{" "}
                        {state?.tournament?.squadSize || 13}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-amber-200">
                    Select your approved team.
                  </p>
                )}
              </section>
            )}

            {/* TEAM ORDER */}

            {auctionFormat === "SNAKE_DRAFT" && (
              <section className="rounded-2xl border border-white/10 bg-panel p-5">
                <h3 className="text-lg font-black">Draft Team Order</h3>

                <div className="mt-4 space-y-2">
                  {(draft?.teamOrder || []).map((team, index) => (
                    <div
                      key={getId(team)}
                      className={`flex items-center justify-between rounded-xl p-3 ${
                        getId(team) === currentTeamId
                          ? "border border-lime/30 bg-lime/10"
                          : "bg-pitch"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs font-black">
                          {index + 1}
                        </span>

                        <span className="text-sm font-bold">{team.name}</span>
                      </div>

                      {getId(team) === currentTeamId && (
                        <span className="text-[10px] font-black text-lime">
                          PICKING
                        </span>
                      )}
                    </div>
                  ))}

                  {!draft?.teamOrder?.length && (
                    <p className="text-sm text-white/40">
                      Draft order will appear after initialization.
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* SELECTION HISTORY */}

            <section className="rounded-2xl border border-white/10 bg-panel p-5">
              <h3 className="text-lg font-black">Selection History</h3>

              <div className="mt-4 space-y-3">
                {selectionHistory.map((selection, index) => (
                  <div
                    key={`${getId(selection.player)}-${index}`}
                    className="rounded-xl bg-pitch p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">
                          {selection.player?.fullName || "Player"}
                        </p>

                        <p className="mt-1 text-xs text-emerald-100/40">
                          {selection.team?.name || "Team"}
                        </p>

                        {auctionFormat === "SNAKE_DRAFT" && (
                          <p className="mt-1 text-[10px] text-white/30">
                            Round {selection.round} · Pick{" "}
                            {selection.pickNumber}
                          </p>
                        )}
                      </div>

                      <span className="text-xs font-black text-lime">
                        {formatPoints(selectionPrice)}
                      </span>
                    </div>
                  </div>
                ))}

                {selectionHistory.length === 0 && (
                  <p className="py-5 text-center text-sm text-emerald-100/40">
                    No players selected yet.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      )}

      {/* VIEWER INFO */}

      {!isTeamOwner && !canOperate && (
        <div className="rounded-2xl border border-white/10 bg-panel p-5">
          <h3 className="font-bold">Auction viewer</h3>

          <p className="mt-2 text-sm leading-relaxed text-emerald-100/50">
            You are viewing this auction in read-only mode.
          </p>
        </div>
      )}
    </div>
  );
}
