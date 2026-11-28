import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { directAuctionService } from "../services/auctionFormatService";

const CATEGORY_DEFAULTS = {
  ICONIC: { min: 5000, max: 15000 },
  A: { min: 3000, max: 10000 },
  B: { min: 2000, max: 7000 },
  C: { min: 1000, max: 5000 },
  D: { min: 500, max: 3000 },
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const idOf = (value) => String(value?._id || value?.id || value || "");

const getLimits = (player, direct) => {
  const category = String(player?.category || "").toUpperCase();

  const defaults = CATEGORY_DEFAULTS[category] || {
    min: 500,
    max: 3000,
  };

  const categoryLimits = direct?.categoryLimits?.[category] || {};

  const playerLimits =
    (direct?.playerBidLimits || []).find(
      (item) => idOf(item.player) === idOf(player),
    ) || {};

  return {
    min: Number(playerLimits.min ?? categoryLimits.min ?? defaults.min),
    max: Number(playerLimits.max ?? categoryLimits.max ?? defaults.max),
  };
};

export default function DirectSelectionPanel({
  auctionId,
  formatState,
  players = [],
  teams = [],
  selectedTeam,
  isTeamOwner,
  canOperate,
  onRefresh,
}) {
  const [bidAmounts, setBidAmounts] = useState({});
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [winnerSelections, setWinnerSelections] = useState({});
  const [awardRemarks, setAwardRemarks] = useState({});
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const direct = formatState?.auction?.directAuction || {};
  const status = direct.status || "DRAFT";
  const submissions = direct.submissions || [];
  const awards = direct.awards || [];
  const ties = direct.ties || [];
  const mySubmission = submissions.find(
    (submission) => idOf(submission.team) === idOf(selectedTeam),
  );

  const auction = formatState?.auction || {};
  const scheduledAt = auction.scheduledAt
    ? new Date(auction.scheduledAt)
    : null;

  const isScheduled = scheduledAt && scheduledAt > new Date();
  const canSubmit =
    status === "SUBMISSION_OPEN" && !mySubmission && !isScheduled;

  // Refresh the state at scheduledAt so the backend can transition the
  // Direct Selection status automatically when the scheduled time arrives.
  useEffect(() => {
    if (status !== "DRAFT" || !scheduledAt || !onRefresh) return undefined;

    const delay = Math.max(0, scheduledAt.getTime() - Date.now());
    const timer = window.setTimeout(() => {
      Promise.resolve(onRefresh()).catch((error) => {
        console.error("Unable to refresh scheduled auction state:", error);
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [status, auction.scheduledAt, onRefresh]);

  const [draftLoadedFor, setDraftLoadedFor] = useState(null);

  const teamId = idOf(selectedTeam);

  const draftStorageKey =
    auctionId && teamId ? `direct-auction-draft:${auctionId}:${teamId}` : null;

  // Restore the team's saved selection and bid amounts.
  useEffect(() => {
    if (!draftStorageKey) {
      setSelectedPlayers([]);
      setBidAmounts({});
      setDraftLoadedFor(null);
      return;
    }

    setDraftLoadedFor(null);

    try {
      const savedDraft =
        typeof window !== "undefined"
          ? window.localStorage.getItem(draftStorageKey)
          : null;

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);

        setSelectedPlayers(
          Array.isArray(parsed.selectedPlayers) ? parsed.selectedPlayers : [],
        );

        setBidAmounts(
          parsed.bidAmounts && typeof parsed.bidAmounts === "object"
            ? parsed.bidAmounts
            : {},
        );
      } else {
        setSelectedPlayers([]);
        setBidAmounts({});
      }
    } catch (error) {
      console.error("Unable to restore auction draft:", error);
      setSelectedPlayers([]);
      setBidAmounts({});
    }

    setDraftLoadedFor(draftStorageKey);
  }, [draftStorageKey]);

  // Save every selection and bid change automatically.
  useEffect(() => {
    if (!draftStorageKey || draftLoadedFor !== draftStorageKey) return;

    // Submitted bids are already stored in the backend.
    if (mySubmission) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey);
      }
      return;
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            selectedPlayers,
            bidAmounts,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
    } catch (error) {
      console.error("Unable to save auction draft:", error);
    }
  }, [
    draftStorageKey,
    draftLoadedFor,
    selectedPlayers,
    bidAmounts,
    mySubmission,
  ]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return players.filter((player) =>
      String(player.fullName || "")
        .toLowerCase()
        .includes(query),
    );
  }, [players, search]);

  const selectedTotal = selectedPlayers.reduce(
    (total, playerId) => total + Number(bidAmounts[playerId] || 0),
    0,
  );
  const remainingPurse = Number(selectedTeam?.purseRemaining || 0);
  const squadLimit = 13;
  const currentSquadCount = Array.isArray(selectedTeam?.squad)
    ? selectedTeam.squad.length
    : 0;
  const remainingSlots = Math.max(0, squadLimit - currentSquadCount);

  const bidsByPlayer = useMemo(() => {
    const grouped = {};
    submissions.forEach((submission) => {
      (submission.bids || []).forEach((bid) => {
        const playerId = idOf(bid.player);
        if (!playerId) return;
        if (!grouped[playerId]) {
          grouped[playerId] = { player: bid.player, bids: [] };
        }
        grouped[playerId].bids.push({
          team: submission.team,
          amount: Number(bid.amount),
        });
      });
    });
    return grouped;
  }, [submissions]);

  const awardedPlayerIds = useMemo(
    () => new Set(awards.map((award) => idOf(award.player))),
    [awards],
  );

  const runAction = async (action, successMessage) => {
    const toastId = toast.loading("Please wait...");

    try {
      setBusy(true);
      await action();
      await onRefresh?.();

      toast.success(successMessage, { id: toastId });
      return true;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to complete this action.";

      toast.error(errorMessage, { id: toastId });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const updateBid = (playerId, value) => {
    setBidAmounts((current) => ({ ...current, [playerId]: value }));
  };

  const togglePlayer = (playerId) => {
    setSelectedPlayers((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }

      if (current.length >= remainingSlots) {
        toast.error(
          `Your team can select up to ${remainingSlots} players in this auction.`,
        );
        return current;
      }

      return [...current, playerId];
    });
  };

  const submitBids = async () => {
    if (!selectedTeam) {
      toast.error("Select your approved team first.");
      return;
    }

    if (!selectedPlayers.length) {
      toast.error("Select at least one player.");
      return;
    }

    if (selectedPlayers.length > remainingSlots) {
      toast.error(
        `Your team has only ${remainingSlots} squad slots remaining.`,
      );
      return;
    }

    // The service/backend expects each bid to identify its player.
    const bids = selectedPlayers.map((playerId) => ({
      player: playerId,
      amount: Number(bidAmounts[playerId]),
    }));

    const invalidBid = selectedPlayers.some((playerId) => {
      const player = players.find((item) => idOf(item) === playerId);
      if (!player) return true;

      const { min, max } = getLimits(player, direct);
      const amount = Number(bidAmounts[playerId]);

      return !Number.isInteger(amount) || amount < min || amount > max;
    });

    if (invalidBid) {
      toast.error(
        "Every bid must be a whole number within that player's minimum and maximum limits.",
      );
      return;
    }

    if (selectedTotal > remainingPurse) {
      toast.error("Your total bid exposure exceeds your remaining purse.");
      return;
    }

    if (
      !window.confirm(
        `Submit ${bids.length} bids totaling ${money(selectedTotal)}? Bids will be locked after submission.`,
      )
    ) {
      return;
    }

    const success = await runAction(
      () =>
        directAuctionService.submitBids(auctionId, idOf(selectedTeam), bids),
      "Your sealed bids have been submitted and locked.",
    );

    // Only clear the local draft after the server confirms success.
    if (success) {
      if (draftStorageKey && typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey);
      }

      setSelectedPlayers([]);
      setBidAmounts({});
    }
  };

  const renderStatus = (value) => String(value || "DRAFT").replaceAll("_", " ");

  return (
    <div
      className={`mx-auto w-full max-w-screen-2xl space-y-4 py-4 text-white sm:space-y-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8 ${canSubmit ? "pb-40 sm:pb-32 lg:pb-32" : ""}`}
    >
      <section className="rounded-2xl border border-lime/20 bg-panel p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-lime">
              Sealed-bid player selection
            </p>
            <h2 className="mt-1 text-2xl font-black">{renderStatus(status)}</h2>
          </div>
          <span className="rounded-full bg-lime/10 px-3 py-2 text-xs font-bold text-lime">
            Round {direct.currentRound || 1}
          </span>
        </div>
        <p className="mt-2 text-sm text-white/50">
          Teams submit private bids. After submissions close, the organizer
          reviews bids and manually approves a winning team for each player.
        </p>
      </section>
      {canOperate && (
        <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-5 lg:p-6">
          <h3 className="text-lg font-black">Organizer controls</h3>

          <p className="mt-3 text-sm text-white/60">
            Auction scheduled at:{" "}
            <strong className="text-lime">
              {scheduledAt ? scheduledAt.toLocaleString() : "Not scheduled"}
            </strong>
          </p>

          <p className="mt-2 text-sm text-white/50">
            {status === "DRAFT"
              ? "Submissions will automatically open at the scheduled auction time."
              : status === "SUBMISSION_OPEN"
                ? "Submissions are currently open."
                : status === "REVIEW"
                  ? "Submissions are closed. You can review and award players."
                  : `Current status: ${renderStatus(status)}`}
          </p>

          {status === "SUBMISSION_OPEN" && (
            <button
              disabled={busy}
              onClick={() =>
                runAction(
                  () => directAuctionService.closeSubmissions(auctionId),
                  "Submissions have been closed.",
                )
              }
              className="mt-4 w-full rounded-xl bg-amber-500 px-5 py-3.5 font-black text-pitch sm:w-auto sm:py-3"
            >
              Close submissions
            </button>
          )}
        </section>
      )}
      {isTeamOwner && (
        <section className="rounded-2xl border border-lime/20 bg-panel p-4 sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div>
              <h3 className="text-xl font-black">Available players & bids</h3>
              <p className="mt-1 text-sm text-white/50">
                {selectedTeam?.name || "Select your team"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">Remaining purse</p>
              <p className="text-xl font-black text-lime">
                {money(remainingPurse)}
              </p>
            </div>
          </div>

          {!selectedTeam && (
            <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
              Please select your approved team first.
            </p>
          )}
          {status === "DRAFT" && scheduledAt && scheduledAt > new Date() && (
            <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
              Bidding opens automatically at {scheduledAt.toLocaleString()}.
              Your saved selections and bids will remain available.
            </p>
          )}
          {status !== "SUBMISSION_OPEN" &&
            status !== "DRAFT" &&
            !mySubmission && (
              <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
                Bidding is not currently open.
              </p>
            )}
          {mySubmission && (
            <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
              Your bids have been submitted and locked.
            </p>
          )}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search available players..."
            className="mt-4 w-full rounded-xl border border-white/10 bg-pitch px-4 py-3.5 text-sm text-white sm:mt-5 sm:py-3"
          />
          <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:gap-5">
            {filteredPlayers.map((player) => {
              const playerId = idOf(player);
              const checked = selectedPlayers.includes(playerId);
              const canEdit =
                canSubmit && Boolean(idOf(selectedTeam)) && remainingSlots > 0;

              const limits = getLimits(player, direct);
              const amount = Number(bidAmounts[playerId] || 0);
              const valid =
                Number.isInteger(amount) &&
                amount >= limits.min &&
                amount <= limits.max;
              return (
                <div
                  key={playerId}
                  className="rounded-xl border border-white/10 bg-pitch p-3 sm:p-4"
                >
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(playerId)}
                      disabled={!canEdit || busy}
                      onChange={() => togglePlayer(playerId)}
                      className="h-5 w-5 cursor-pointer accent-lime disabled:cursor-not-allowed"
                    />
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
                      <p className="truncate font-bold">{player.fullName}</p>
                      <p className="mt-1 text-xs text-white/40">
                        {player.category} · {player.role}
                      </p>
                    </div>
                  </label>
                  {checked && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-white/50">
                        <span>Minimum: {money(limits.min)}</span>
                        <span>Maximum: {money(limits.max)}</span>
                      </div>
                      <label className="mt-2 block text-xs text-white/50">
                        Your sealed bid
                        <input
                          type="number"
                          min={limits.min}
                          max={limits.max}
                          step="1"
                          value={bidAmounts[playerId] || ""}
                          disabled={!canEdit || busy}
                          onChange={(e) => updateBid(playerId, e.target.value)}
                          placeholder={`Enter ${money(limits.min)} or more`}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-panel px-3 py-3.5 text-sm text-white sm:py-3 disabled:opacity-50"
                        />
                      </label>
                      {amount > 0 && !valid && (
                        <p className="mt-2 text-xs text-red-300">
                          Bid must be between {money(limits.min)} and{" "}
                          {money(limits.max)}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredPlayers.length === 0 && (
            <p className="py-8 text-center text-sm text-white/40">
              No available players found.
            </p>
          )}

          {canSubmit && (
            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-lime/20 bg-pitch/95 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="mx-auto w-full max-w-screen-2xl px-3 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:px-5 sm:py-4 lg:px-8">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                  {/* Bid summary */}
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 lg:gap-10">
                    <div>
                      <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-white/50 sm:text-xs sm:tracking-wider">
                        Selected players
                      </p>
                      <p className="mt-1 text-base font-black text-white sm:text-xl">
                        {selectedPlayers.length}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-white/50 sm:text-xs sm:tracking-wider">
                        Bid exposure
                      </p>
                      <p className="mt-1 text-base font-black text-lime sm:text-xl">
                        {money(selectedTotal)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-white/50 sm:text-xs sm:tracking-wider">
                        Purse after bids
                      </p>
                      <p
                        className={`mt-1 text-base font-black sm:text-xl ${
                          remainingPurse - selectedTotal < 0
                            ? "text-red-400"
                            : "text-white"
                        }`}
                      >
                        {money(remainingPurse - selectedTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Submit action */}
                  <button
                    disabled={
                      busy ||
                      !selectedTeam ||
                      !selectedPlayers.length ||
                      selectedTotal > remainingPurse ||
                      selectedPlayers.some((id) => {
                        const player = players.find(
                          (item) => idOf(item) === id,
                        );

                        if (!player) return true;

                        const limits = getLimits(player, direct);
                        const amount = Number(bidAmounts[id]);

                        return (
                          !Number.isInteger(amount) ||
                          amount < limits.min ||
                          amount > limits.max
                        );
                      })
                    }
                    onClick={submitBids}
                    className="w-full rounded-xl bg-lime px-4 py-3.5 text-sm font-black text-pitch transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-64 sm:px-6"
                  >
                    {busy
                      ? "SUBMITTING..."
                      : `SUBMIT ${selectedPlayers.length} SEALED BIDS`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
      {canOperate && (
        <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-5 lg:p-6">
          <h3 className="text-xl font-black">Submitted team bids</h3>
          {status === "SUBMISSION_OPEN" && (
            <p className="mt-1 text-xs text-amber-200">
              Bids are hidden from team owners and are visible here only to
              auction operators.
            </p>
          )}
          <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            {submissions.map((submission, index) => (
              <div
                key={idOf(submission.team) || index}
                className="rounded-xl bg-pitch p-4"
              >
                <div className="flex justify-between gap-3">
                  <strong>{submission.team?.name || "Team"}</strong>
                  <span className="text-xs text-white/40">
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleString()
                      : ""}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {(submission.bids || []).map((bid, bidIndex) => (
                    <div
                      key={`${idOf(bid.player)}-${bidIndex}`}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span className="text-white/60">
                        {bid.player?.fullName || "Player"}
                      </span>
                      <strong className="text-lime">{money(bid.amount)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!submissions.length && (
              <p className="py-6 text-center text-sm text-white/40">
                No team submissions yet.
              </p>
            )}
          </div>
        </section>
      )}
      {canOperate && status === "REVIEW" && (
        <section className="rounded-2xl border border-lime/20 bg-panel p-4 sm:p-5 lg:p-6">
          <h3 className="text-xl font-black">Manual winner approval</h3>
          <p className="mt-1 text-sm text-white/50">
            Select the winning team from teams that submitted a bid for each
            player.
          </p>
          <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
            {Object.entries(bidsByPlayer).map(([playerId, data]) => {
              if (awardedPlayerIds.has(playerId)) return null;
              return (
                <div key={playerId} className="rounded-xl bg-pitch p-4">
                  <h4 className="font-bold">
                    {data.player?.fullName || "Player"}
                  </h4>
                  <div className="mt-3 space-y-2">
                    {data.bids.map((bid, index) => (
                      <div
                        key={`${idOf(bid.team)}-${index}`}
                        className="flex justify-between rounded-lg border border-white/10 p-3 text-sm"
                      >
                        <span>{bid.team?.name || "Team"}</span>
                        <strong className="text-lime">
                          {money(bid.amount)}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <label className="mt-4 block text-sm text-white/50">
                    Winning team
                    <select
                      value={winnerSelections[playerId] || ""}
                      onChange={(e) =>
                        setWinnerSelections((current) => ({
                          ...current,
                          [playerId]: e.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg bg-panel px-3 py-3.5 text-sm text-white sm:py-3"
                    >
                      <option value="">Choose winning team</option>
                      {data.bids.map((bid, index) => (
                        <option
                          key={`${idOf(bid.team)}-${index}`}
                          value={idOf(bid.team)}
                        >
                          {bid.team?.name} — {money(bid.amount)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-3 block text-sm text-white/50">
                    Organizer remarks (optional)
                    <textarea
                      rows={2}
                      value={awardRemarks[playerId] || ""}
                      onChange={(e) =>
                        setAwardRemarks((current) => ({
                          ...current,
                          [playerId]: e.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-lg bg-panel px-3 py-3.5 text-sm text-white sm:py-3"
                    />
                  </label>
                  <button
                    disabled={busy || !winnerSelections[playerId]}
                    onClick={() => {
                      const teamId = winnerSelections[playerId];
                      const chosen = data.bids.find(
                        (bid) => idOf(bid.team) === teamId,
                      );
                      if (!chosen) {
                        toast.error("Choose a valid bidding team.");
                        return;
                      }
                      if (
                        !window.confirm(
                          `Award ${data.player?.fullName} to ${chosen.team?.name} for ${money(chosen.amount)}?`,
                        )
                      )
                        return;
                      runAction(
                        () =>
                          directAuctionService.awardPlayer(
                            auctionId,
                            playerId,
                            teamId,
                            awardRemarks[playerId] || "",
                          ),
                        "Player awarded successfully.",
                      );
                    }}
                    className="mt-4 w-full rounded-lg bg-lime px-4 py-3.5 font-black text-pitch disabled:opacity-40 sm:py-3"
                  >
                    Approve and award player
                  </button>
                </div>
              );
            })}
            {!Object.keys(bidsByPlayer).some(
              (id) => !awardedPlayerIds.has(id),
            ) && (
              <p className="py-6 text-center text-sm text-white/40">
                All submitted player bids have been decided.
              </p>
            )}
          </div>
        </section>
      )}
      {status === "TIE_BREAK" && (
        <section className="rounded-2xl border border-amber-400/20 bg-panel p-5">
          <h3 className="text-xl font-black text-amber-300">Tie-break round</h3>
          <p className="mt-2 text-sm text-white/50">
            Tie-break submissions are retained for compatibility with your
            existing backend. The tie-break API must validate eligible teams and
            category maximums.
          </p>
          {ties.map((tie) => (
            <div
              key={idOf(tie.player)}
              className="mt-3 rounded-xl bg-pitch p-3"
            >
              <strong>{tie.player?.fullName || "Tied player"}</strong>
              <p className="mt-1 text-xs text-white/40">
                Eligible teams:{" "}
                {(tie.eligibleTeams || [])
                  .map((team) => team?.name || "Team")
                  .join(", ")}
              </p>
            </div>
          ))}
        </section>
      )}
      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-5 lg:p-6">
        <h3 className="text-xl font-black">Final player awards</h3>
        <div className="mt-4 space-y-2">
          {awards.map((award, index) => (
            <div
              key={`${idOf(award.player)}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-pitch p-3"
            >
              <div>
                <p className="font-bold">
                  {award.player?.fullName || "Player"}
                </p>
                <p className="text-xs text-white/40">
                  {award.team?.name || "Team"}
                </p>
                {award.remarks && (
                  <p className="mt-1 text-xs text-white/40">{award.remarks}</p>
                )}
              </div>
              <strong className="text-lime">{money(award.amount)}</strong>
            </div>
          ))}
          {!awards.length && (
            <p className="py-5 text-center text-sm text-white/40">
              No players awarded yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
