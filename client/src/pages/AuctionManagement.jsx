import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const MANAGER_ROLES = ["super_admin", "org_admin", "admin"];

const AUCTION_FORMATS = [
  {
    value: "LIVE_BIDDING",
    label: "Live Open Bidding",
    description:
      "Auctioneer starts players, teams bid, and the auctioneer marks Sold or Unsold.",
  },
  {
    value: "SNAKE_DRAFT",
    label: "Snake Draft",
    description:
      "Teams select players in turns. The selection order reverses every round.",
  },
  {
    value: "DIRECT_SELECTION",
    label: "Direct Selection",
    description: "Approved team owners can directly select available players.",
  },
];

const dateLabel = (value) =>
  value ? new Date(value).toLocaleString() : "Not scheduled";

const toLocalDateTimeInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
};

const initialForm = {
  tournamentId: "",
  auctionName: "",
  auctioneerIds: [],
  scheduledAt: "",
  timerSeconds: 45,
  minimumReservePerSlot: 500,
  auctionFormat: "LIVE_BIDDING",
  selectionPrice: 500,
};

const formatPoints = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function AuctionManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const canManage = MANAGER_ROLES.includes(user?.role);
  const isAuctioneer = user?.role === "auctioneer";
  const isTeamOwner = user?.role === "team_owner";

  const [rows, setRows] = useState([]);

  const [options, setOptions] = useState({
    tournaments: [],
    auctioneers: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(initialForm);

  const selectedFormat = AUCTION_FORMATS.find(
    (item) => item.value === form.auctionFormat,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/auction-management");

      setRows(response.data.auctions || []);

      if (canManage) {
        const setup = await api.get("/auction-management/setup-options");

        setOptions({
          tournaments: setup.data.tournaments || [],
          auctioneers: setup.data.auctioneers || [],
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load auctions.");
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: rows.filter((row) => row.auction).length,

      live: rows.filter((row) => row.auction?.status === "RUNNING").length,

      scheduled: rows.filter(
        (row) => row.auction?.status === "IDLE" && row.auction?.scheduledAt,
      ).length,

      completed: rows.filter((row) => row.auction?.status === "COMPLETED")
        .length,
    }),
    [rows],
  );

  const openCreate = () => {
    setForm({ ...initialForm });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const editAuction = (row) => {
    const auction = row.auction;

    setForm({
      tournamentId: row.tournament._id,

      auctionName: auction?.auctionName || `${row.tournament.name} Auction`,

      auctioneerIds: (
        auction?.assignedAuctioneers ||
        row.tournament.auctioneers ||
        []
      ).map((item) => String(item._id || item)),

      scheduledAt: auction?.scheduledAt
        ? toLocalDateTimeInput(auction.scheduledAt)
        : "",

      timerSeconds: auction?.timerSeconds || 45,

      minimumReservePerSlot: auction?.minimumReservePerSlot ?? 500,

      auctionFormat: auction?.auctionFormat || "LIVE_BIDDING",

      selectionPrice: auction?.selectionPrice ?? 500,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.tournamentId) {
      setError("Select a tournament.");
      return;
    }

    if (
      !["LIVE_BIDDING", "SNAKE_DRAFT", "DIRECT_SELECTION"].includes(
        form.auctionFormat,
      )
    ) {
      setError("Select a valid auction format.");
      return;
    }

    const selectionPrice = Number(form.selectionPrice);

    if (!Number.isSafeInteger(selectionPrice) || selectionPrice < 0) {
      setError("Selection price must be a valid non-negative whole number.");
      return;
    }

    const timerSeconds = Number(form.timerSeconds);
    const minimumReservePerSlot = Number(form.minimumReservePerSlot);

    if (
      !Number.isInteger(timerSeconds) ||
      timerSeconds < 5 ||
      timerSeconds > 300
    ) {
      setError("Bid timer must be between 5 and 300 seconds.");
      return;
    }

    if (!Number.isFinite(minimumReservePerSlot) || minimumReservePerSlot < 0) {
      setError("Reserve per slot cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auction-management", {
        ...form,

        timerSeconds,

        minimumReservePerSlot,

        selectionPrice,

        scheduledAt: form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : null,
      });

      setShowForm(false);

      setSuccess("Auction configuration saved successfully.");

      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save auction.");
    } finally {
      setSaving(false);
    }
  };

  const toggleAuctioneer = (id) => {
    setForm((current) => ({
      ...current,

      auctioneerIds: current.auctioneerIds.includes(id)
        ? current.auctioneerIds.filter((item) => item !== id)
        : [...current.auctioneerIds, id],
    }));
  };

  const openAuction = (row) => {
    if (!row.auction?._id) return;

    navigate(
      `/dashboard/auctions/${row.auction._id}/tournament/${row.tournament._id}`,
    );
  };

  const publicAuctionUrl = (auctionId) =>
    `${window.location.origin}/auction/live/${auctionId}`;

  const watchLive = (auctionId) => {
    window.open(publicAuctionUrl(auctionId), "_blank", "noopener,noreferrer");
  };

  const copyPublicLink = async (auctionId) => {
    setError("");
    setSuccess("");

    try {
      await navigator.clipboard.writeText(publicAuctionUrl(auctionId));

      setSuccess("Public auction link copied.");
    } catch {
      setError(
        "Unable to copy automatically. Open the live page and copy its URL.",
      );
    }
  };

  const formatLabel = (format) =>
    AUCTION_FORMATS.find((item) => item.value === format)?.label ||
    "Live Open Bidding";

  if (loading) {
    return (
      <div className="grid min-h-[300px] place-items-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-lime" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-lime">
            Tournament operations
          </p>

          <h1 className="mt-2 text-3xl font-black">Auction Management</h1>

          <p className="mt-2 text-sm text-emerald-100/50">
            Create tournament auctions, choose auction formats, assign
            auctioneers and open live auction rooms.
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreate}
            className="rounded-xl bg-lime px-5 py-3 text-sm font-black text-pitch hover:bg-lime/80"
          >
            + Create Auction
          </button>
        )}
      </div>

      {/* ALERTS */}

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {/* STATS */}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Auctions", stats.total],
          ["Live now", stats.live],
          ["Scheduled", stats.scheduled],
          ["Completed", stats.completed],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-panel p-5"
          >
            <p className="text-sm text-emerald-100/50">{label}</p>

            <p className="mt-2 text-3xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {/* AUCTION LIST */}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
          <div>
            <h2 className="font-black">Tournament auctions</h2>

            <p className="mt-1 text-xs text-emerald-100/40">
              {isAuctioneer
                ? "Auctions assigned to you"
                : isTeamOwner
                  ? "Auctions for your approved teams"
                  : "Auctions in your organization"}
            </p>
          </div>

          <button
            onClick={load}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold hover:bg-white/5"
          >
            Refresh
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl">🏏</div>

            <h3 className="mt-3 font-bold">No tournament auctions found</h3>

            <p className="mt-1 text-sm text-emerald-100/40">
              {canManage
                ? "Create an auction for one of your tournaments to get started."
                : "No auction has been created or assigned to your tournaments yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {rows.map((row) => {
              const auction = row.auction;
              const status = auction?.status || "NOT_CREATED";

              const badge =
                status === "RUNNING"
                  ? "bg-red-500/15 text-red-300"
                  : status === "COMPLETED"
                    ? "bg-white/10 text-white/50"
                    : auction
                      ? "bg-lime/10 text-lime"
                      : "bg-amber-400/10 text-amber-200";

              const assignedAuctioneers =
                auction?.assignedAuctioneers ||
                row.tournament.auctioneers ||
                [];

              const format = auction?.auctionFormat || "LIVE_BIDDING";

              return (
                <div
                  key={row.tournament._id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">
                        {row.tournament.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide ${badge}`}
                      >
                        {status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-emerald-100/45">
                      {row.tournament.season || "Current season"}
                      {" · "}
                      {row.tournament.organization?.name || "Organization"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-emerald-100/55">
                      <span>
                        Auction: {auction?.auctionName || "Not created"}
                      </span>

                      <span>Format: {formatLabel(format)}</span>

                      {auction && format !== "LIVE_BIDDING" && (
                        <span>
                          Selection price:{" "}
                          {formatPoints(auction.selectionPrice ?? 500)}
                        </span>
                      )}

                      <span>
                        Auctioneer:{" "}
                        {assignedAuctioneers
                          .map((item) => item.name || "Assigned")
                          .join(", ") || "Not assigned"}
                      </span>

                      <span>Schedule: {dateLabel(auction?.scheduledAt)}</span>

                      {auction?.createdBy?.name && (
                        <span>Created by: {auction.createdBy.name}</span>
                      )}
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div className="flex flex-wrap gap-2">
                    {canManage && (
                      <button
                        onClick={() => editAuction(row)}
                        disabled={
                          status === "RUNNING" || status === "COMPLETED"
                        }
                        className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/5 disabled:opacity-40"
                      >
                        {auction ? "Edit / Assign" : "Configure"}
                      </button>
                    )}

                    {auction && (
                      <>
                        <button
                          type="button"
                          onClick={() => watchLive(auction._id)}
                          className="rounded-lg border border-lime/40 px-4 py-2.5 text-xs font-bold text-lime hover:bg-lime/10"
                        >
                          Watch Live
                        </button>

                        <button
                          type="button"
                          onClick={() => copyPublicLink(auction._id)}
                          className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/5"
                        >
                          Copy Public Link
                        </button>
                      </>
                    )}

                    {auction && (
                      <button
                        onClick={() => openAuction(row)}
                        className="rounded-lg bg-lime px-4 py-2.5 text-xs font-black text-pitch hover:bg-lime/80"
                      >
                        {status === "RUNNING"
                          ? "Open Live Room"
                          : isTeamOwner
                            ? "View Auction"
                            : "Open Auction"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CREATE / EDIT MODAL */}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <form
            onSubmit={submit}
            className="my-8 w-full max-w-2xl space-y-5 rounded-2xl border border-white/10 bg-[#101c19] p-6 shadow-2xl"
          >
            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-lime">
                  Auction setup
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Create / Configure Auction
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-1 text-xl text-white/50 hover:bg-white/10"
              >
                ×
              </button>
            </div>

            {/* TOURNAMENT */}

            <div>
              <label className="mb-2 block text-xs font-bold text-emerald-100/60">
                Tournament *
              </label>

              <select
                required
                value={form.tournamentId}
                onChange={(event) => {
                  const tournamentId = event.target.value;

                  const tournament = options.tournaments.find(
                    (item) => item._id === tournamentId,
                  );

                  setForm((current) => ({
                    ...current,
                    tournamentId,
                    auctionName:
                      current.auctionName ||
                      `${tournament?.name || "Tournament"} Auction`,
                  }));
                }}
                disabled={Boolean(
                  rows.find(
                    (row) =>
                      row.tournament._id === form.tournamentId && row.auction,
                  ),
                )}
                className="w-full rounded-xl border border-white/10 bg-[#172722] px-4 py-3 text-sm outline-none focus:border-lime disabled:opacity-60"
              >
                <option value="">Select tournament</option>

                {options.tournaments.map((tournament) => (
                  <option key={tournament._id} value={tournament._id}>
                    {tournament.name}
                    {tournament.season ? ` · ${tournament.season}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* AUCTION NAME */}

            <div>
              <label className="mb-2 block text-xs font-bold text-emerald-100/60">
                Auction name
              </label>

              <input
                value={form.auctionName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    auctionName: event.target.value,
                  }))
                }
                placeholder="Tournament Auction"
                className="w-full rounded-xl border border-white/10 bg-[#172722] px-4 py-3 text-sm outline-none focus:border-lime"
              />
            </div>

            {/* AUCTION FORMAT */}

            <div>
              <label className="mb-2 block text-xs font-bold text-emerald-100/60">
                Auction Format *
              </label>

              <div className="grid gap-3">
                {AUCTION_FORMATS.map((format) => {
                  const selected = form.auctionFormat === format.value;

                  return (
                    <button
                      type="button"
                      key={format.value}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          auctionFormat: format.value,
                        }))
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-lime bg-lime/10"
                          : "border-white/10 bg-[#172722] hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">{format.label}</span>

                        <span
                          className={`h-4 w-4 rounded-full border ${
                            selected ? "border-lime bg-lime" : "border-white/30"
                          }`}
                        />
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-emerald-100/45">
                        {format.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FIXED SELECTION PRICE */}

            {form.auctionFormat !== "LIVE_BIDDING" && (
              <div className="rounded-xl border border-lime/20 bg-lime/5 p-4">
                <label className="mb-2 block text-xs font-bold text-lime">
                  Fixed Player Selection Price (₹) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={form.selectionPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      selectionPrice: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#172722] px-4 py-3 text-lg font-black outline-none focus:border-lime"
                />

                <p className="mt-2 text-xs text-emerald-100/50">
                  Every player selected through {selectedFormat?.label} will
                  deduct{" "}
                  <strong className="text-lime">
                    {formatPoints(form.selectionPrice)}
                  </strong>{" "}
                  from the selecting team's remaining purse.
                </p>

                <p className="mt-2 text-[11px] text-emerald-100/35">
                  Example: A team with ₹50,000 purse selecting 3 players at ₹500
                  each will have ₹48,500 remaining.
                </p>
              </div>
            )}

            {/* AUCTIONEERS */}

            <div>
              <label className="mb-2 block text-xs font-bold text-emerald-100/60">
                Assign auctioneers
              </label>

              <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-[#172722] p-3">
                {options.auctioneers.length ? (
                  options.auctioneers.map((auctioneer) => (
                    <label
                      key={auctioneer._id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={form.auctioneerIds.includes(
                          String(auctioneer._id),
                        )}
                        onChange={() =>
                          toggleAuctioneer(String(auctioneer._id))
                        }
                        className="h-4 w-4 accent-lime"
                      />

                      <span className="text-sm">
                        {auctioneer.name}

                        <span className="ml-2 text-xs text-white/40">
                          {auctioneer.email}
                        </span>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="p-2 text-xs text-amber-200">
                    No active auctioneers found in this organization. Create or
                    activate auctioneer accounts first.
                  </p>
                )}
              </div>

              <p className="mt-1 text-[11px] text-white/35">
                Only active auctioneer accounts from this organization are
                listed.
              </p>
            </div>

            {/* TIMER / RESERVE / SCHEDULE */}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold text-emerald-100/60">
                  Bid timer (seconds)
                </label>

                <input
                  type="number"
                  min="5"
                  max="300"
                  required
                  value={form.timerSeconds}
                  disabled={form.auctionFormat !== "LIVE_BIDDING"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      timerSeconds: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#172722] px-3 py-3 text-sm disabled:opacity-40"
                />

                {form.auctionFormat !== "LIVE_BIDDING" && (
                  <p className="mt-1 text-[10px] text-white/35">
                    Used for live bidding only.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-emerald-100/60">
                  Reserve per slot
                </label>

                <input
                  type="number"
                  min="0"
                  required
                  value={form.minimumReservePerSlot}
                  disabled={form.auctionFormat !== "LIVE_BIDDING"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      minimumReservePerSlot: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#172722] px-3 py-3 text-sm disabled:opacity-40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-emerald-100/60">
                  Schedule (optional)
                </label>

                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      scheduledAt: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#172722] px-3 py-3 text-sm [color-scheme:dark]"
                />
              </div>
            </div>

            {/* FORMAT SUMMARY */}

            <div className="rounded-xl border border-white/10 bg-[#172722] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-100/40">
                Configuration summary
              </p>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-emerald-100/50">Format</span>

                  <span className="font-bold">{selectedFormat?.label}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-emerald-100/50">
                    Player selection charge
                  </span>

                  <span className="font-bold text-lime">
                    {form.auctionFormat === "LIVE_BIDDING"
                      ? "Based on winning bid"
                      : formatPoints(form.selectionPrice)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-emerald-100/50">
                    Assigned auctioneers
                  </span>

                  <span className="font-bold">{form.auctioneerIds.length}</span>
                </div>
              </div>
            </div>

            {/* FORM ERROR */}

            {error && (
              <p className="rounded-lg bg-red-400/10 p-3 text-sm text-red-200">
                {error}
              </p>
            )}

            {/* FORM ACTIONS */}

            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold"
              >
                Cancel
              </button>

              <button
                disabled={saving || !form.tournamentId}
                className="rounded-xl bg-lime px-5 py-3 text-sm font-black text-pitch disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Auction"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
