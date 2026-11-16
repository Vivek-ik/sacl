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
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#071b16] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-emerald-100/30 focus:border-lime/60";

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

export default function AddTournamentsModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
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

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        teamLimit: Number(form.teamLimit),
        squadSize: Number(form.squadSize),
        purseTotal: Number(form.purseTotal),
      };

      const { data } = await api.post("/tournaments", payload);

      onCreated?.(data.tournament);
      onClose?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create tournament. Please try again.",
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
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b211a] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-lime/10 p-3 text-lime">
              <Trophy size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Create Tournament
              </h2>
              <p className="text-xs text-emerald-100/40">
                Configure your new cricket tournament
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-emerald-100/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="overflow-y-auto p-5 sm:p-7">
          {error && (
            <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Basic information */}
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
                  placeholder="SACL Premier League"
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

              <Field label="Initial Status">
                <select
                  className={inputClass}
                  name="status"
                  value={form.status}
                  onChange={updateField}
                >
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
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

          {/* Footer */}
          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-emerald-100/70 transition hover:bg-white/5 disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-bold text-[#071b16] transition hover:bg-lime/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Trophy size={17} />
                  Create Tournament
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
