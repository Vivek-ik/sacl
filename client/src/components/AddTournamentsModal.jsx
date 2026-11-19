import { useEffect, useState } from "react";
import { X, Trophy, Loader2 } from "lucide-react";
import { api } from "../lib/api";

const initialForm = {
  name: "",
  season: "",
  description: "",
  format: "T20",
  startDate: "",
  endDate: "",
  venue: "",
  city: "",
  teamLimit: 10,
  squadSize: 13,
  purseTotal: 50000,
  status: "draft",
  auctionStatus: "pending",
  approvalStatus: "pending",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#050817] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-emerald-100/30 focus:border-lime/60";

const labelClass = "mb-1.5 block text-sm font-medium text-emerald-50/80";

function Field({ label, required, children }) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export default function AddTournamentsModal({
  onClose,
  onCreated,
  tournament = null,
  onUpdate,
}) {
  const isEditing = Boolean(tournament?._id);

  const [form, setForm] = useState(() => ({
    ...initialForm,
    ...(tournament || {}),
    startDate: toDateInput(tournament?.startDate),
    endDate: toDateInput(tournament?.endDate),
  }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose?.();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, saving]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.startDate || !form.endDate) {
      setError("Please select both tournament dates.");
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

    if (Number(form.teamLimit) < 2 || Number(form.teamLimit) > 100) {
      setError("Maximum teams must be between 2 and 100.");
      return;
    }

    if (Number(form.squadSize) < 1 || Number(form.squadSize) > 50) {
      setError("Squad size must be between 1 and 50.");
      return;
    }

    if (Number(form.purseTotal) < 0) {
      setError("Team purse cannot be negative.");
      return;
    }

    const payload = {
      // Tournament details
      name: form.name.trim(),
      season: form.season.trim(),
      description: form.description.trim(),
      format: form.format,

      // Schedule
      startDate: form.startDate,
      endDate: form.endDate,
      venue: form.venue.trim(),
      city: form.city.trim(),

      // Configuration
      teamLimit: Number(form.teamLimit),
      squadSize: Number(form.squadSize),
      purseTotal: Number(form.purseTotal),

      // Status fields
      status: form.status,
      auctionStatus: form.auctionStatus,
      approvalStatus: form.approvalStatus,

      // Preserve existing ownership metadata during edits.
      ...(isEditing && {
        organization: tournament.organization?._id || tournament.organization,
        createdBy: tournament.createdBy?._id || tournament.createdBy,
      }),
    };

    try {
      setSaving(true);

      if (isEditing) {
        const { data } = await api.patch(
          `/tournaments/${tournament._id}`,
          payload,
        );

        onUpdate?.(
          data.tournament || {
            ...tournament,
            ...payload,
          },
        );
      } else {
        const { data } = await api.post("/tournaments", payload);
        onCreated?.(data.tournament);
      }

      onClose?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Unable to ${isEditing ? "update" : "create"} tournament.`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose?.();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050817] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-lime/10 p-3 text-lime">
              <Trophy size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? "Edit Tournament" : "Create Tournament"}
              </h2>
              <p className="text-xs text-emerald-100/40">
                {isEditing
                  ? "Update all tournament details and configuration"
                  : "Configure your new cricket tournament"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-emerald-100/50 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="overflow-y-auto p-5 sm:p-7">
          {error && (
            <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <section>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-lime">
              Basic Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tournament Name" required>
                <input
                  className={inputClass}
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  maxLength={120}
                  required
                />
              </Field>

              <Field label="Season / Edition">
                <input
                  className={inputClass}
                  name="season"
                  value={form.season}
                  onChange={updateField}
                  maxLength={30}
                  placeholder="2027"
                />
              </Field>

              <Field label="Tournament Format">
                <select
                  className={inputClass}
                  name="format"
                  value={form.format}
                  onChange={updateField}
                >
                  <option value="T10">T10</option>
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                  <option value="TEST">Test</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </Field>

              <Field label="Tournament Status">
                <select
                  className={inputClass}
                  name="status"
                  value={form.status}
                  onChange={updateField}
                >
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    className={inputClass}
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    rows={3}
                    maxLength={1000}
                    placeholder="Describe your tournament..."
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section className="mt-7 border-t border-white/10 pt-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-lime">
              Schedule & Venue
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start Date" required>
                <input
                  className={inputClass}
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={updateField}
                  required
                />
              </Field>

              <Field label="End Date" required>
                <input
                  className={inputClass}
                  type="date"
                  name="endDate"
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={updateField}
                  required
                />
              </Field>

              <Field label="Venue">
                <input
                  className={inputClass}
                  name="venue"
                  value={form.venue}
                  onChange={updateField}
                  placeholder="Cricket stadium / ground"
                />
              </Field>

              <Field label="City">
                <input
                  className={inputClass}
                  name="city"
                  value={form.city}
                  onChange={updateField}
                  placeholder="Indore"
                />
              </Field>
            </div>
          </section>

          {/* Configuration */}
          <section className="mt-7 border-t border-white/10 pt-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-lime">
              Tournament Configuration
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Maximum Teams" required>
                <input
                  className={inputClass}
                  type="number"
                  name="teamLimit"
                  min="2"
                  max="100"
                  value={form.teamLimit}
                  onChange={updateField}
                  required
                />
              </Field>

              <Field label="Squad Size" required>
                <input
                  className={inputClass}
                  type="number"
                  name="squadSize"
                  min="1"
                  max="50"
                  value={form.squadSize}
                  onChange={updateField}
                  required
                />
              </Field>

              <Field label="Team Purse (₹)" required>
                <input
                  className={inputClass}
                  type="number"
                  name="purseTotal"
                  min="0"
                  step="1000"
                  value={form.purseTotal}
                  onChange={updateField}
                  required
                />
              </Field>
            </div>

            <p className="mt-2 text-xs text-emerald-100/40">
              This is the auction budget allocated to each team.
            </p>
          </section>

          {/* Auction & Approval */}
          <section className="mt-7 border-t border-white/10 pt-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-lime">
              Auction & Approval Settings
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Auction Status">
                <select
                  className={inputClass}
                  name="auctionStatus"
                  value={form.auctionStatus}
                  onChange={updateField}
                >
                  <option value="pending">Pending</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </Field>

              <Field label="Approval Status">
                <select
                  className={inputClass}
                  name="approvalStatus"
                  value={form.approvalStatus}
                  onChange={updateField}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>
            </div>
          </section>

          {/* Ownership metadata */}
          {isEditing && (
            <section className="mt-7 border-t border-white/10 pt-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-lime">
                Ownership Information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Organization ID">
                  <input
                    className={inputClass}
                    value={
                      tournament.organization?._id ||
                      tournament.organization ||
                      ""
                    }
                    readOnly
                  />
                </Field>

                <Field label="Created By User ID">
                  <input
                    className={inputClass}
                    value={
                      tournament.createdBy?._id || tournament.createdBy || ""
                    }
                    readOnly
                  />
                </Field>
              </div>

              <p className="mt-2 text-xs text-emerald-100/40">
                Ownership information is preserved and cannot be changed here.
              </p>
            </section>
          )}

          {/* Footer */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-emerald-100/70 hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-bold text-[#071b16] hover:bg-lime/90 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Trophy size={17} />
                  {isEditing ? "Save Changes" : "Create Tournament"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
