import { useCallback, useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Loader2,
} from "lucide-react";
import { api } from "../lib/api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "scorer",
};

export default function ScorerManagement() {
  const [scorers, setScorers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchScorers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/admin/scorers");
      setScorers(data.scorers || data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load scorers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScorers();
  }, [fetchScorers]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.post("/admin/scorers", form);

      setForm(initialForm);
      setSuccess("Scorer account created successfully.");
      await fetchScorers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create scorer.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (scorer) => {
    const nextStatus = scorer.isActive === false;

    try {
      setUpdatingId(scorer._id);
      setError("");
      setSuccess("");

      await api.patch(`/admin/scorers/${scorer._id}/status`, {
        isActive: nextStatus,
      });

      setSuccess(
        nextStatus
          ? "Scorer activated successfully."
          : "Scorer deactivated successfully.",
      );

      await fetchScorers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update scorer status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Scorer Management
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Create scorer accounts and manage their access to SACL matches.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        {/* Create scorer */}
        <section className="h-fit rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <UserPlus size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-white">Add New Scorer</h2>
              <p className="text-xs text-slate-400">
                Create login credentials for a scorer
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">
                Full name
              </label>
              <input
                className={inputClass}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter scorer name"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-300">
                Email address
              </label>
              <input
                className={inputClass}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="scorer@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-300">
                Phone number
              </label>
              <input
                className={inputClass}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-slate-300">
                Temporary password
              </label>
              <input
                className={inputClass}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              {saving ? "Creating..." : "Create Scorer"}
            </button>
          </form>
        </section>

        {/* Scorer list */}
        <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                <Users size={21} />
              </div>
              <div>
                <h2 className="font-semibold text-white">All Scorers</h2>
                <p className="text-xs text-slate-400">
                  {scorers.length} scorer account(s)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchScorers}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-emerald-400" />
            </div>
          ) : scorers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="mx-auto mb-3 text-slate-600" size={35} />
              <p className="font-medium text-slate-300">No scorers added yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Create your first scorer using the form.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scorers.map((scorer) => {
                const active = scorer.isActive !== false;

                return (
                  <div
                    key={scorer._id}
                    className="flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 font-bold text-emerald-400">
                        {scorer.name?.charAt(0)?.toUpperCase() || "S"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {scorer.name}
                        </p>
                        <p className="break-all text-sm text-slate-400">
                          {scorer.email}
                        </p>
                        {scorer.phone && (
                          <p className="text-xs text-slate-500">
                            {scorer.phone}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {scorer.assignedMatchesCount ?? 0} assigned match(es)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          active
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>

                      <button
                        type="button"
                        disabled={updatingId === scorer._id}
                        onClick={() => toggleStatus(scorer)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
                          active
                            ? "border-red-500/20 text-red-300 hover:bg-red-500/10"
                            : "border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10"
                        }`}
                      >
                        {updatingId === scorer._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : active ? (
                          <ShieldX size={14} />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                        {active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
